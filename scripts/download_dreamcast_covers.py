#!/usr/bin/env python3
"""
Script to download Dreamcast game cover images.
Uses multiple sources: ScreenScraper, IGDB, and direct URLs.
"""

import csv
import urllib.request
import os
from pathlib import Path
from urllib.parse import quote
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

# Configuration
CSV_PATH = '/home/guimove/repos/guimove-tcg-collections/public/dreamcast/collection.csv'
COVERS_DIR = '/home/guimove/repos/guimove-tcg-collections/public/dreamcast/covers'
MAX_WORKERS = 10  # Number of parallel downloads

def sanitize_filename(serial):
    """Convert serial to safe filename"""
    return serial.replace('/', '-').replace(' ', '_')

def try_screenscraper(game_name, region):
    """
    Try to get image from ScreenScraper (no auth required for some queries)
    """
    # ScreenScraper requires authentication, skipping for now
    return None

def try_direct_urls(game_name, serial, region):
    """
    Try common patterns for Dreamcast cover URLs
    """
    urls_to_try = [
        # Try various public CDNs and databases
        f"https://images.launchbox-games.com/games/{quote(game_name)}-01.jpg",
        f"https://www.mobygames.com/images/covers/l/{quote(game_name)}-dreamcast-front-cover.jpg",
    ]

    for url in urls_to_try:
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            with urllib.request.urlopen(req, timeout=10) as response:
                data = response.read()
                if len(data) > 5000:  # Reasonable image size
                    return data
        except Exception as e:
            continue

    return None

def search_libretro_thumbnails(game_name, region):
    """
    Try LibRetro thumbnail repository (GitHub)
    """
    # Clean game name for LibRetro format
    clean_name = game_name.replace(':', '').replace('/', '-')

    urls = [
        f"https://raw.githubusercontent.com/libretro-thumbnails/Sega_-_Dreamcast/master/Named_Boxarts/{quote(clean_name)}.png",
        f"https://raw.githubusercontent.com/libretro-thumbnails/Sega_-_Dreamcast/master/Named_Titles/{quote(clean_name)}.png",
    ]

    for url in urls:
        try:
            with urllib.request.urlopen(url, timeout=10) as response:
                return response.read()
        except:
            continue

    return None

def download_single_cover(game, index, total):
    """Download a single cover image"""
    name = game['name']
    serial = game['serial']
    region = game['region']

    # Create filename from serial
    filename = f"{sanitize_filename(serial)}.jpg"
    filepath = os.path.join(COVERS_DIR, filename)

    # Skip if already exists
    if os.path.exists(filepath):
        return {'status': 'exists', 'name': name, 'index': index}

    # Try different sources
    image_data = None

    # Try LibRetro thumbnails first (most reliable for retro games)
    image_data = search_libretro_thumbnails(name, region)
    if image_data:
        source = 'LibRetro'
    else:
        # Try direct URLs
        image_data = try_direct_urls(name, serial, region)
        if image_data:
            source = 'Direct URL'

    # Save image
    if image_data:
        with open(filepath, 'wb') as f:
            f.write(image_data)
        return {'status': 'success', 'name': name, 'index': index, 'source': source}
    else:
        return {'status': 'failed', 'name': name, 'index': index}

def download_covers():
    """Main function to download all covers"""
    Path(COVERS_DIR).mkdir(parents=True, exist_ok=True)

    # Read CSV
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        games = list(reader)

    print(f"📦 Found {len(games)} games")
    print(f"📁 Covers will be saved to: {COVERS_DIR}")
    print(f"🚀 Starting download with {MAX_WORKERS} parallel workers...\n")

    success_count = 0
    exists_count = 0
    failed_games = []

    # Download with thread pool
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Submit all download tasks
        futures = {
            executor.submit(download_single_cover, game, i, len(games)): game
            for i, game in enumerate(games, 1)
        }

        # Process results as they complete
        for future in as_completed(futures):
            result = future.result()

            if result['status'] == 'exists':
                exists_count += 1
                print(f"⏭️  [{result['index']}/{len(games)}] Already exists: {result['name']}")
            elif result['status'] == 'success':
                success_count += 1
                print(f"✅ [{result['index']}/{len(games)}] Downloaded from {result['source']}: {result['name']}")
            else:
                failed_games.append(result['name'])
                print(f"❌ [{result['index']}/{len(games)}] Not found: {result['name']}")

    # Summary
    print("\n" + "="*60)
    print(f"✅ Successfully downloaded: {success_count}")
    print(f"⏭️  Already existed: {exists_count}")
    print(f"❌ Failed: {len(failed_games)}")
    print(f"📊 Total: {success_count + exists_count}/{len(games)}")

    if failed_games and len(failed_games) <= 20:
        print("\n❌ Failed games:")
        for game in failed_games[:20]:
            print(f"   - {game}")
        if len(failed_games) > 20:
            print(f"   ... and {len(failed_games) - 20} more")

if __name__ == '__main__':
    try:
        download_covers()
    except KeyboardInterrupt:
        print("\n\n⚠️  Download interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
