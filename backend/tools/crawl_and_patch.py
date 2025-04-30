import os
import hashlib
# import requests # Removed requests
from bs4 import BeautifulSoup
from datetime import datetime
from dotenv import load_dotenv
import sys
from playwright.sync_api import sync_playwright, Error as PlaywrightError # Added playwright import

# Load environment variables from .env file in the backend directory
# Assuming the script is run from the root or backend directory
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(dotenv_path=os.path.join(backend_dir, ".env"))

API_URL = os.getenv("CHATBOT_HOST", "http://localhost:8000") + "/api/prompt/update"
TARGET_URL = os.getenv("PORTFOLIO_URL")
# Place hash file in the same directory as the script for simplicity
HASH_FILE = os.path.join(os.path.dirname(__file__), "last_hash.txt")

def extract_text(html: str) -> str:
    """Extracts relevant text content from the HTML."""
    soup = BeautifulSoup(html, "html.parser")
    # Try to find a main content area, fallback to body
    # This selector might need adjustment based on the actual portfolio site structure
    # main_content = soup.select_one("main, #main, #content, #app") or soup.body
    # if not main_content:
    #     return ""
    # Remove script and style tags first
    for script_or_style in soup(["script", "style"]):
        script_or_style.decompose()
    # Get text, join lines with newline, strip extra whitespace, limit length
    text = soup.get_text("\n", strip=True)
    # --- Debug: Print extracted text ---
    # print("--- Extracted Text (first 500 chars) ---")
    # print(text[:500])
    # print("----------------------------------------")
    # --- End Debug ---
    return text[:16000] # Limit length as per original doc

def get_hash(text: str) -> str:
    """Calculates SHA256 hash of the text."""
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def get_last_hash() -> str:
    """Reads the last stored hash from the file."""
    try:
        with open(HASH_FILE, "r", encoding='utf-8') as f:
            return f.read().strip()
    except FileNotFoundError:
        return ""

def update_prompt_api(prompt_text: str) -> bool:
    # Keep using requests for the API call, assuming the API endpoint itself doesn't need JS rendering
    import requests # Import requests locally for the API call
    try:
        headers = {"Content-Type": "application/json"}
        response = requests.patch(API_URL, json={"text": prompt_text}, headers=headers, timeout=15)
        response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)
        print(f"API call successful: Status {response.status_code}, Response: {response.json()}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"Error calling prompt update API ({API_URL}): {e}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"An unexpected error occurred during API call: {e}", file=sys.stderr)
        return False

def save_hash(new_hash: str):
    """Saves the new hash to the file."""
    try:
        with open(HASH_FILE, "w", encoding='utf-8') as f:
            f.write(new_hash)
    except IOError as e:
        print(f"Error writing hash file ({HASH_FILE}): {e}", file=sys.stderr)

def main():
    """Main function to crawl, compare hash, and update prompt via API."""
    if not TARGET_URL:
        print("Error: PORTFOLIO_URL environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    print(f"Crawling target URL: {TARGET_URL} using Playwright...")
    html_content = ""
    try:
        with sync_playwright() as p:
            # Consider adding options like headless=True for background execution
            # browser = p.chromium.launch(headless=False) # Launch browser (visible for debugging)
            browser = p.chromium.launch() # Launch browser (headless by default)
            page = browser.new_page()
            # Increase timeout if the page takes long to load
            page.goto(TARGET_URL, timeout=60000) # 60 seconds timeout
            # Wait for network activity to be idle, indicating potential JS loading is complete
            page.wait_for_load_state('networkidle', timeout=60000) # Add network idle wait
            # Optionally, wait for specific elements if needed, e.g.:
            # page.wait_for_selector('main')
            html_content = page.content() # Get HTML after JS execution
            browser.close()
    except PlaywrightError as e:
        print(f"Error fetching portfolio URL ({TARGET_URL}) with Playwright: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e: # Catch other potential errors
        print(f"An unexpected error occurred during Playwright operation: {e}", file=sys.stderr)
        sys.exit(1)

    if not html_content:
        print("Error: Failed to retrieve HTML content using Playwright.", file=sys.stderr)
        sys.exit(1)

    print("Extracting text from HTML...")
    current_text = extract_text(html_content)
    if not current_text:
        print("Warning: Could not extract text from the page even with Playwright.")
        # Decide if you want to proceed with an empty prompt or exit
        # current_text = "" # Or sys.exit(1)

    print(f"Calculating hash for extracted text (length: {len(current_text)})...")
    current_hash = get_hash(current_text)
    print(f"Current Hash: {current_hash}")

    print(f"Reading last hash from: {HASH_FILE}")
    last_hash = get_last_hash()
    print(f"Last Hash: {last_hash}")

    if current_hash == last_hash:
        print("No changes detected in portfolio content. Skipping prompt update.")
        return

    print("Change detected. Preparing new prompt...")
    # Construct the new prompt (consider adding more context if needed)
    new_prompt = f"あなたはポートフォリオの所有者本人です。あなたの最新のポートフォリオ情報は以下の通りです。これに基づいて質問に答えてください。\n\n---\n{current_text}\n---"

    print(f"Updating prompt via API: {API_URL}")
    if update_prompt_api(new_prompt):
        print(f"Saving new hash: {current_hash}")
        save_hash(current_hash)
        print(f"Prompt update process completed successfully at {datetime.utcnow()}.")
    else:
        print("Prompt update failed. Hash not updated.", file=sys.stderr)
        sys.exit(1) # Exit with error code if API call failed

if __name__ == "__main__":
    main() 

