# utils/trust_calculator.py
from datetime import datetime, timedelta
from typing import List, Dict
from decimal import Decimal

def calculate_trust_score(user_data: Dict) -> float:
    """
    Calculate trust score based on user's rating and transaction history
    Score ranges from 0-100, with 100 being perfect trust
    """
    base_score = 100.0
    
    # Extract user metrics
    average_rating = float(user_data.get('average_rating', 0))
    total_ratings = user_data.get('total_ratings', 0)
    total_transactions = user_data.get('total_transactions', 0)
    successful_transactions = user_data.get('successful_transactions', 0)
    late_returns = user_data.get('late_returns', 0)
    
    # Rating component (40% weight)
    if total_ratings > 0:
        # Scale rating from 1-5 to 0-40 points
        rating_score = (average_rating / 5.0) * 40
        
        # Bonus for having many ratings (reliability indicator)
        rating_bonus = min(5, total_ratings * 0.5)
        rating_score += rating_bonus
    else:
        # New users get neutral score
        rating_score = 20
    
    # Transaction success rate (30% weight)
    if total_transactions > 0:
        success_rate = successful_transactions / total_transactions
        transaction_score = success_rate * 30
        
        # Penalty for very few transactions
        if total_transactions < 3:
            transaction_score *= 0.8
    else:
        # New users get neutral score
        transaction_score = 15
    
    # Punctuality component (20% weight)
    if total_transactions > 0:
        late_rate = late_returns / total_transactions
        # Perfect punctuality = 20 points, each 10% late rate = -4 points
        punctuality_score = max(0, 20 - (late_rate * 40))
    else:
        # New users get neutral score
        punctuality_score = 10
    
    # Activity bonus (10% weight)
    # Reward active users, but cap the bonus
    activity_score = min(10, total_transactions * 0.5)
    
    # Calculate final score
    final_score = rating_score + transaction_score + punctuality_score + activity_score
    
    # Ensure score is within bounds
    return max(0, min(100, final_score))

def determine_badges_to_award(user, ratings_data: List, transactions_data: List) -> List[str]:
    """
    Determine which badges a user should be awarded based on their activity
    """
    badges_to_award = []
    
    # Calculate metrics
    total_transactions = len(transactions_data)
    successful_transactions = len([t for t in transactions_data if t.get('status') == 'completed'])
    late_returns = len([t for t in transactions_data if t.get('status') == 'overdue' or 
                       (t.get('actual_return_date') and t.get('expected_return_date') and 
                        t.get('actual_return_date') > t.get('expected_return_date'))])
    
    average_rating = float(user.average_rating) if user.average_rating else 0
    days_since_joined = (datetime.utcnow() - user.created_at).days if user.created_at else 0
    
    # Reliable badge: 4.5+ rating with 10+ transactions
    if average_rating >= 4.5 and total_transactions >= 10:
        badges_to_award.append('reliable')
    
    # Quick Returner: 90%+ on-time returns with 5+ transactions
    if total_transactions >= 5:
        on_time_transactions = total_transactions - late_returns
        on_time_rate = on_time_transactions / total_transactions if total_transactions > 0 else 0
        if on_time_rate >= 0.9:
            badges_to_award.append('quick_returner')
    
    # New User: Less than 30 days and fewer than 3 transactions
    if days_since_joined <= 30 and total_transactions < 3:
        badges_to_award.append('new_user')
    
    # Verified: Has email and phone (for future implementation)
    if user.email:  # Basic verification for now
        badges_to_award.append('verified')
    
    # Book Curator: Has listed 20+ books
    if hasattr(user, 'books') and len(user.books) >= 20:
        badges_to_award.append('book_curator')
    
    # Active Member: 50+ transactions
    if total_transactions >= 50:
        badges_to_award.append('active_member')
    
    # Trusted Lender: 4.8+ rating as lender with 15+ lending transactions
    lender_ratings = [r for r in ratings_data if r.get('rating_type') == 'lender']
    if len(lender_ratings) >= 15:
        lender_avg = sum(r.get('rating', 0) for r in lender_ratings) / len(lender_ratings)
        if lender_avg >= 4.8:
            badges_to_award.append('trusted_lender')
    
    return badges_to_award

def get_trust_level_info(trust_score: float) -> Dict[str, str]:
    """
    Get trust level information based on trust score
    """
    if trust_score >= 90:
        return {
            "level": "highly_trusted",
            "label": "Highly Trusted",
            "color": "#4CAF50",
            "icon": "shield-checkmark",
            "description": "Exceptional track record with the community"
        }
    elif trust_score >= 75:
        return {
            "level": "trusted",
            "label": "Trusted",
            "color": "#2196F3",
            "icon": "shield",
            "description": "Reliable member with good history"
        }
    elif trust_score >= 60:
        return {
            "level": "reliable",
            "label": "Reliable",
            "color": "#FF9800",
            "icon": "shield-outline",
            "description": "Generally dependable member"
        }
    elif trust_score >= 45:
        return {
            "level": "building_trust",
            "label": "Building Trust",
            "color": "#FFC107",
            "icon": "hourglass",
            "description": "New member building reputation"
        }
    else:
        return {
            "level": "use_caution",
            "label": "Use Caution",
            "color": "#F44336",
            "icon": "warning",
            "description": "Limited history or concerning patterns"
        }

def should_hide_profile(trust_score: float, total_ratings: int) -> bool:
    """
    Determine if a user's profile should be hidden from search results
    """
    # Hide profiles with very low trust scores
    if trust_score < 30:
        return True
    
    # Hide profiles with consistently bad ratings (if they have enough ratings)
    if total_ratings >= 5 and trust_score < 40:
        return True
    
    return False

def get_badge_info(badge_type: str) -> Dict[str, str]:
    """
    Get display information for badges
    """
    badge_configs = {
        'reliable': {
            'label': 'Reliable',
            'icon': 'shield-checkmark',
            'color': '#4CAF50',
            'description': '4.5+ rating with 10+ transactions'
        },
        'quick_returner': {
            'label': 'Quick Returner',
            'icon': 'time',
            'color': '#2196F3',
            'description': '90%+ on-time returns'
        },
        'new_user': {
            'label': 'New User',
            'icon': 'person-add',
            'color': '#FF9800',
            'description': 'New to the community'
        },
        'verified': {
            'label': 'Verified',
            'icon': 'checkmark-circle',
            'color': '#9C27B0',
            'description': 'Verified account'
        },
        'book_curator': {
            'label': 'Book Curator',
            'icon': 'library',
            'color': '#795548',
            'description': '20+ books listed'
        },
        'active_member': {
            'label': 'Active Member',
            'icon': 'star',
            'color': '#FF5722',
            'description': '50+ transactions completed'
        },
        'trusted_lender': {
            'label': 'Trusted Lender',
            'icon': 'hand-left',
            'color': '#607D8B',
            'description': '4.8+ rating as lender'
        }
    }
    
    return badge_configs.get(badge_type, {
        'label': badge_type.replace('_', ' ').title(),
        'icon': 'ribbon',
        'color': '#9E9E9E',
        'description': 'Special recognition'
    })
