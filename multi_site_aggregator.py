import re
import time
import requests
from bs4 import BeautifulSoup
import mysql.connector
import schedule

# Database connection details
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "root123",
    "database": "uganda_rentals_db"
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def clean_price(price_text):
    """Extract numbers from strings like 'UGX 1,500,000 / month' or '$500'"""
    if not price_text:
        return 0.0
    numbers = re.sub(r'[^\d]', '', price_text)
    return float(numbers) if numbers else 0.0

def save_property(title, listing_type, prop_type, price_ugx, location, image_url, source_url, phone_number, owner_name):
    """Saves property and owner into MySQL, blocking duplicate entries."""
    if price_ugx <= 0 or not title:
        return

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        # Check for duplicate entry based on title and price
        cursor.execute("SELECT property_id FROM properties WHERE title = %s AND price_ugx = %s", (title, price_ugx))
        if cursor.fetchone():
            return  # Already imported

        # Get or Create Owner
        cursor.execute("SELECT owner_id FROM owners WHERE phone_number = %s", (phone_number,))
        owner = cursor.fetchone()

        if not owner:
            cursor.execute(
                "INSERT INTO owners (full_name, phone_number, whatsapp_number, is_verified) VALUES (%s, %s, %s, %s)",
                (owner_name, phone_number, phone_number, True)
            )
            conn.commit()
            owner_id = cursor.lastrowid
        else:
            owner_id = owner[0]

        # Insert Listing
        cursor.execute("""
            INSERT INTO properties (owner_id, title, listing_type, property_type, price_ugx, location, image_url, source_url, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'Available')
        """, (owner_id, title, listing_type, prop_type, price_ugx, location, image_url, source_url))
        
        conn.commit()
        print(f"✅ Imported [{listing_type}]: {title} - UGX {price_ugx:,.0f} ({location})")

    except Exception as e:
        print(f"DB Error: {e}")
    finally:
        cursor.close()
        conn.close()

# --- Target Site Scrapers ---

def scrape_jumia_deals():
    """Scrapes Rentals & Houses from Jumia Deals Uganda"""
    print("🔍 Crawling Jumia Deals Uganda...")
    url = "https://deals.jumia.ug/apartments-houses-for-rent"
    try:
        res = requests.get(url, headers=HEADERS, timeout=10)
        if res.status_code != 200: return
        soup = BeautifulSoup(res.text, 'html.parser')
        
        for card in soup.select("article.post"):
            title_el = card.select_one("span.post-link") or card.select_one("h3")
            price_el = card.select_one("span.price")
            loc_el = card.select_one("span.address")
            img_el = card.select_one("img")

            title = title_el.text.strip() if title_el else ""
            price = clean_price(price_el.text) if price_el else 0
            location = loc_el.text.strip() if loc_el else "Kampala"
            img_url = img_el.get("data-src") or img_el.get("src") if img_el else "assets/images/default.jpg"
            
            save_property(title, "Rent", "Apartment", price, location, img_url, url, "0782939552", "Jumia Verified Landlord")
    except Exception as e:
        print(f"Jumia Scraper Error: {e}")

def run_all_scrapers():
    print(f"\n--- Starting Automated Import: {time.strftime('%Y-%m-%d %H:%M:%S')} ---")
    scrape_jumia_deals()

# Schedule to automatically run every 20 minutes
schedule.every(20).minutes.do(run_all_scrapers)

if __name__ == "__main__":
    run_all_scrapers() # Initial run
    print("🚀 Aggregator Service running in background. Scanning every 20 minutes...")
    while True:
        schedule.run_pending()
        time.sleep(1)