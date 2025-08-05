from datetime import datetime,timezone
print(datetime.utcnow().isoformat())
print(datetime.now(timezone.utc))