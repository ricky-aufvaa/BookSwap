# utils/google_books.py
import httpx
from fastapi import HTTPException
from config.settings import settings

async def search_google_books(query: str, max_results: int = 10):
    # Enhanced search parameters for better relevance
    params = {
        "q": f"intitle:{query}",

        "key": settings.GOOGLE_BOOKS_API_KEY,
        "maxResults": max_results,
        "orderBy": "relevance",  # Sort by relevance instead of newest
        # "printType": "books",    # Only return actual books, not magazines
        "projection": "full",    # Get full volume info including ratings
        "langRestrict": "en"     # Restrict to English books for better results
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(settings.GOOGLE_BOOKS_URL, params=params)
            response.raise_for_status()
            data = response.json()

            books = []
            for item in data.get("items", []):
                vol = item["volumeInfo"]
                sale_info = item.get("saleInfo", {})
                
                # Calculate a relevance score based on multiple factors
                relevance_score = 0
                
                # Rating factor (0-5 points)
                avg_rating = vol.get("averageRating", 0)
                ratings_count = vol.get("ratingsCount", 0)
                if avg_rating and ratings_count:
                    # Weight by both rating and number of ratings
                    # relevance_score += (avg_rating / 5.0) * min(ratings_count / 100, 5)
                    relevance_score = avg_rating + ratings_count
                
                # Publication recency factor (0-2 points for books published in last 100 years)
                # pub_date = vol.get("publishedDate", "")
                # if pub_date:
                #     try:
                #         year = int(pub_date.split("-")[0])
                #         current_year = 2024
                #         if year >= current_year - 100:
                #             relevance_score += 2 * (1 - (current_year - year) / 100)
                #     except:
                #         pass
                
                # Page count factor (0-1 points, prefer substantial books)
                # page_count = vol.get("pageCount", 0)
                # if page_count:
                #     if 100 <= page_count <= 800:  # Sweet spot for most books
                #         relevance_score += 1
                #     elif page_count > 50:
                #         relevance_score += 0.5
                
                # Availability factor (0-1 points)
                if sale_info.get("saleability") in ["FOR_SALE", "FREE"]:
                    relevance_score += 0.5
                
                # Has description factor (0-0.5 points)
                if vol.get("description"):
                    relevance_score += 1
                
                # Has thumbnail factor (0-0.5 points)
                if vol.get("imageLinks", {}).get("thumbnail"):
                    relevance_score += 1

                # Extract thumbnail URL with debugging
                thumbnail_url = vol.get("imageLinks", {}).get("smallThumbnail", "")
                print(f"DEBUG - Book: {vol.get('title', 'Unknown')}")
                print(f"DEBUG - ImageLinks: {vol.get('imageLinks', {})}")
                print(f"DEBUG - Thumbnail URL: {thumbnail_url}")
                
                book_data = {
                    "title": vol.get("title", "Unknown"),
                    "author": ", ".join(vol.get("authors", ["Unknown"])),
                    "publisher": vol.get("publisher", "Unknown"),
                    "published_date": vol.get("publishedDate", "Unknown"),
                    "description": vol.get("description", ""),
                    "thumbnail": thumbnail_url,
                    "isbn": next((id['identifier'] for id in vol.get("industryIdentifiers", []) 
                                if id['type'] in ['ISBN_10', 'ISBN_13']), None),
                    "average_rating": avg_rating,
                    "ratings_count": ratings_count,
                    # "page_count": page_count,
                    "categories": vol.get("categories", []),
                    "relevance_score": relevance_score
                }
                
                books.append(book_data)
            
            # Sort by relevance score (highest first)
            books.sort(key=lambda x: x["relevance_score"], reverse=True)
            
            return books
        except Exception as e:
            raise HTTPException(500, f"Search failed: {str(e)}")
