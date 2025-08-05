# utils/google_books.py
import httpx
from fastapi import HTTPException
from config.settings import settings

async def search_google_books(query: str, max_results: int = 5):
    params = {
        "q": query,
        "key": settings.GOOGLE_BOOKS_API_KEY,
        "maxResults": max_results
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(settings.GOOGLE_BOOKS_URL, params=params)
            response.raise_for_status()
            data = response.json()

            books = []
            for item in data.get("items", []):
                vol = item["volumeInfo"]
                books.append({
                    "title": vol.get("title", "Unknown"),
                    "author": ", ".join(vol.get("authors", ["Unknown"])),
                    "publisher": vol.get("publisher", "Unknown"),
                    "published_date": vol.get("publishedDate", "Unknown"),
                    "description": vol.get("description", ""),
                    "thumbnail": vol.get("imageLinks", {}).get("thumbnail", ""),
                    "isbn": next((id['identifier'] for id in vol.get("industryIdentifiers", []) if id['type'] in ['ISBN_10', 'ISBN_13']), None)
                })
            return books
        except Exception as e:
            raise HTTPException(500, f"Search failed: {str(e)}")