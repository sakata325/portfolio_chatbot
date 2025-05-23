import hashlib
import importlib.util
import os
import sys
from datetime import datetime
from typing import List, Set
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import Page, sync_playwright

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(dotenv_path=os.path.join(backend_dir, ".env"))

API_URL = os.getenv("CHATBOT_HOST", "http://localhost:8000") + "/api/prompt/update"
TARGET_URL = os.getenv("PORTFOLIO_URL")
HASH_FILE = os.path.join(os.path.dirname(__file__), "last_hash.txt")
MAX_CRAWL_PAGES = 20


def is_same_domain(base_url: str, new_url: str) -> bool:
    """Checks if the new URL belongs to the same domain as the base URL."""
    try:
        base_domain = urlparse(base_url).netloc
        new_domain = urlparse(new_url).netloc
        return base_domain == new_domain
    except ValueError:
        return False


def get_internal_links(page: Page, base_url: str) -> Set[str]:
    """Extracts internal links (same domain) from the page."""
    links: Set[str] = set()
    parsed_base_url = urlparse(base_url)
    base_domain = parsed_base_url.netloc

    hrefs = page.eval_on_selector_all(
        "a[href]", "elements => elements.map(el => el.href)"
    )

    for href in hrefs:
        try:
            absolute_url = urljoin(base_url, href)
            parsed_url = urlparse(absolute_url)

            if (
                parsed_url.scheme in ["http", "https"]
                and parsed_url.netloc == base_domain
            ):
                clean_url = urljoin(absolute_url, parsed_url.path)
                links.add(clean_url)
        except ValueError:
            continue
    return links


def extract_text(html: str) -> str:
    """Extracts relevant text content from the HTML."""
    soup = BeautifulSoup(html, "html.parser")

    for script_or_style in soup(["script", "style"]):
        script_or_style.decompose()

    text = soup.get_text("\n", strip=True)

    return text[:16000]


def get_hash(text: str) -> str:
    """Calculates SHA256 hash of the text."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def get_last_hash() -> str:
    """Reads the last stored hash from the file."""
    try:
        with open(HASH_FILE, "r", encoding="utf-8") as f:
            return f.read().strip()
    except FileNotFoundError:
        return ""


def update_prompt_api(prompt_text: str) -> bool:
    try:
        headers = {"Content-Type": "application/json"}
        response = requests.patch(
            API_URL, json={"text": prompt_text}, headers=headers, timeout=600
        )
        response.raise_for_status()
        print(
            f"API call successful: Status {response.status_code}, "
            f"Response: {response.json()}"
        )
        return True

    except requests.exceptions.RequestException as e:
        print(f"Error calling prompt update API ({API_URL}): {e}", file=sys.stderr)
        return False

    except Exception as e:
        print(f"An unexpected error occurred during API call: {e}", file=sys.stderr)
        return False


def save_hash(new_hash: str) -> None:
    """Saves the new hash to the file."""
    try:
        with open(HASH_FILE, "w", encoding="utf-8") as f:
            f.write(new_hash)
    except IOError as e:
        print(f"Error writing hash file ({HASH_FILE}): {e}", file=sys.stderr)


def main() -> None:
    """Main function to crawl, compare hash, and update prompt via API."""
    if not TARGET_URL:
        print("Error: PORTFOLIO_URL environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    # --- Dynamically load prompt_config --- START
    print("Locating prompt configuration...")
    try:
        script_path = os.path.abspath(__file__)
        tools_dir = os.path.dirname(script_path)
        backend_dir_dynamic = os.path.dirname(tools_dir)
        config_path = os.path.join(backend_dir_dynamic, "prompt_config.py")

        if not os.path.exists(config_path):
            raise FileNotFoundError(f"prompt_config.py not found at {config_path}")

        spec = importlib.util.spec_from_file_location("prompt_config", config_path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Could not load spec for {config_path}")
        prompt_config = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(prompt_config)
        print("Prompt configuration loaded successfully.")

    except Exception as e:
        print(f"Error loading prompt_config.py: {e}", file=sys.stderr)
        sys.exit(1)
    # --- Dynamically load prompt_config --- END

    print("Starting crawl process...")
    urls_to_visit: Set[str] = {TARGET_URL}
    visited_urls: Set[str] = set()
    all_html_content: List[str] = []
    pages_crawled = 0

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()

            while urls_to_visit and pages_crawled < MAX_CRAWL_PAGES:
                current_url = urls_to_visit.pop()
                if current_url in visited_urls:
                    continue

                print(f"({pages_crawled + 1}/{MAX_CRAWL_PAGES}) Visit: {current_url}")
                try:
                    page.goto(current_url, timeout=60000)
                    page.wait_for_load_state("networkidle", timeout=60000)
                    html = page.content()
                    all_html_content.append(html)
                    visited_urls.add(current_url)
                    pages_crawled += 1

                    if pages_crawled < MAX_CRAWL_PAGES:
                        new_links = get_internal_links(page, current_url)
                        urls_to_visit.update(new_links - visited_urls)

                except PlaywrightError as e:
                    print(f"  Error visiting {current_url}: {e}", file=sys.stderr)
                except Exception as e:
                    print(f"  Unexpected error on {current_url}: {e}", file=sys.stderr)

            browser.close()

    except Exception as e:
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
        sys.exit(1)

    if not all_html_content:
        print("Error: Failed to retrieve any HTML content.", file=sys.stderr)
        sys.exit(1)

    print(f"\nExtracting text from {len(all_html_content)} crawled pages...")

    combined_portfolio_text = "\n\n--- (ページ区切り) ---\n\n".join(
        [extract_text(html) for html in all_html_content if html]
    )

    print(f"Total combined text length: {len(combined_portfolio_text)}")

    print("Reading prompt template from loaded config...")
    try:
        system_template = prompt_config.SYSTEM_PROMPT_TEMPLATE
    except AttributeError as e:
        print(
            f"Error: SYSTEM_PROMPT_TEMPLATE not found in prompt_config.py: {e}",
            file=sys.stderr,
        )
        sys.exit(1)

    print("Calculating hash based on portfolio content...")
    content_for_hash = combined_portfolio_text.strip()
    current_hash = get_hash(content_for_hash)
    print(f"Current Hash (based on portfolio): {current_hash}")

    print(f"Reading last hash from: {HASH_FILE}")
    last_hash = get_last_hash()
    print(f"Last Hash: {last_hash}")

    if current_hash == last_hash:
        print("No changes detected in portfolio content. Skipping prompt update.")
        return

    print("Change detected. Constructing new prompt...")

    new_prompt = system_template.format(
        portfolio_content=combined_portfolio_text.strip()
    )

    print(f"Updating prompt via API: {API_URL}")

    if update_prompt_api(new_prompt):
        print(f"Saving new hash: {current_hash}")
        save_hash(current_hash)
        print(f"Prompt update process completed successfully at {datetime.utcnow()}.")
    else:
        print("Prompt update failed. Hash not updated.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
