import re
import requests
from bs4 import BeautifulSoup
import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root123",
        database="uganda_rentals_db"
    )

def clean_price(price_text):
    """Extract numeric UGX value from string like 'UGX 1,200,000 / month' or 'Shs 850,000'"""
    if not price_text:
        return 0.0
    numbers = re.sub(r'[^\d]', '', price_text)
    return float(numbers) if numbers else 0.0

# Header configuration to avoid getting blocked
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
}

# ==========================================
# 1. SCRAPER FOR JUMIA DEALS / CLASSIFIEDS
# ==========================================
def scrape_jumia_uganda_rentals():
    target_url = "https://deals.jumia.ug/apartments-houses-for-rent"
    print(f"Scanning Jumia Deals Uganda: {target_url}")
    
    try:
        response = requests.get(target_url, headers=HEADERS, timeout=12)
        if response.status_code != 200:
            print(f"Failed Jumia fetch with status {response.status_code}")
            return

        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Jumia listing containers
        articles = soup.select("article.post")

        conn = get_db_connection()
        cursor = conn.cursor()

        for post in articles:
            # Extract title
            title_elem = post.select_one("span.post-link") or post.select_one("h3")
            title = title_elem.get_text(strip=True) if title_elem else "Apartment/House Rental"

            # Extract price
            price_elem = post.select_one("span.price")
            raw_price = price_elem.get_text(strip=True) if price_elem else "0"
            price_ugx = clean_price(raw_price)

            # Extract location
            loc_elem = post.select_one("span.address") or post.select_one(".address-bar")
            location = loc_elem.get_text(strip=True) if loc_elem else "Kampala, Uganda"

            # Extract Image URL
            img_elem = post.select_one("img")
            image_url = img_elem.get("data-src") or img_elem.get("src") if img_elem else "assets/images/default.jpg"

            # Save to Database
            save_scraped_listing(cursor, conn, title, price_ugx, location, image_url, "0782939552", "Jumia Landlord")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Jumia Scraper Error: {e}")

# ==========================================
# 2. SCRAPER FOR REAL ESTATE DATABASE (RED) UGANDA
# ==========================================
def scrape_red_uganda_rentals():
    target_url = "https://www.realestatedatabase.net/FindProperty/ForRent"
    print(f"Scanning Real Estate Database Uganda: {target_url}")

    try:
        response = requests.get(target_url, headers=HEADERS, timeout=12)
        if response.status_code != 200:
            print(f"Failed RED fetch with status {response.status_code}")
            return

        soup = BeautifulSoup(response.text, 'html.parser')

        # RED listing boxes
        cards = soup.select(".property-item") or soup.select(".listing-box")

        conn = get_db_connection()
        cursor = conn.cursor()

        for card in cards:
            title_elem = card.select_one(".property-title") or card.select_one("h4")
            title = title_elem.get_text(strip=True) if title_elem else "Rental Property in Kampala"

            price_elem = card.select_one(".property-price") or card.select_one(".price")
            raw_price = price_elem.get_text(strip=True) if price_elem else "0"
            price_ugx = clean_price(raw_price)

            loc_elem = card.select_one(".location") or card.select_one(".property-location")
            location = loc_elem.get_text(strip=True) if loc_elem else "Kampala"

            img_elem = card.select_one("img")
            image_url = img_elem.get("src") if img_elem else "assets/images/default.jpg"

            phone_elem = card.select_one(".phone-number") or card.select_one("a[href^='tel:']")
            phone = phone_elem.get_text(strip=True) if phone_elem else "0705070233"

            save_scraped_listing(cursor, conn, title, price_ugx, location, image_url, phone, "RED Listing Agent")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"RED Scraper Error: {e}")

# ==========================================
# HELPER FUNCTION: SAVE & DEDUPLICATE IN MYSQL
# ==========================================
def save_scraped_listing(cursor, conn, title, price_ugx, location, image_url, phone, owner_name):
    # Avoid zero/invalid price insertions
    if price_ugx <= 0:
        return

    # 1. Prevent inserting duplicate listings based on title and price
    cursor.execute("SELECT property_id FROM properties WHERE title = %s AND price_ugx = %s", (title, price_ugx))
    if cursor.fetchone():
        return

    # 2. Check if landlord owner exists, or insert new
    cursor.execute("SELECT owner_id FROM owners WHERE phone_number = %s", (phone,))
    owner = cursor.fetchone()

    if not owner:
        cursor.execute(
            "INSERT INTO owners (full_name, phone_number, whatsapp_number, is_verified) VALUES (%s, %s, %s, %s)",
            (owner_name, phone, phone, True)
        )
        conn.commit()
        owner_id = cursor.lastrowid
    else:
        owner_id = owner[0]

    # 3. Insert property record
    cursor.execute("""
        INSERT INTO properties (owner_id, title, property_type, price_ugx, location, image_url, status)
        VALUES (%s, %s, 'Apartment', %s, %s, %s, 'Available')
    """, (owner_id, title, price_ugx, location, image_url))
    
    conn.commit()
    print(f"✅ Aggregated: {title} | UGX {price_ugx:,.0f} | Location: {location}")

# ==========================================
# EXECUTION
# ==========================================
if __name__ == "__main__":
    scrape_jumia_uganda_rentals()
    scrape_red_uganda_rentals()