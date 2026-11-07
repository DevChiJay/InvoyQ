"""
Grant or revoke Pro for a list of users from the terminal.

Dry run by default: it prints who would change. Add --apply to write.

    python scripts/grant_pro.py --emails ada@example.com,tolu@example.com --days 365
    python scripts/grant_pro.py --emails-file early-adopters.txt            # no end date
    python scripts/grant_pro.py --emails ada@example.com --revoke --apply

Uses MONGODB_URI / MONGODB_DB_NAME from backend/.env, so check which database that is
before using --apply.
"""
import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.repositories.user_repository import UserRepository  # noqa: E402
from app.services.plans import is_pro_active  # noqa: E402


def read_emails(args: argparse.Namespace) -> list[str]:
    emails: list[str] = []
    if args.emails:
        emails += [e.strip() for e in args.emails.split(",")]
    if args.emails_file:
        for line in Path(args.emails_file).read_text().splitlines():
            line = line.split("#", 1)[0].strip()
            if line:
                emails.append(line)
    seen: set[str] = set()
    unique = []
    for e in emails:
        if e and e.lower() not in seen:
            seen.add(e.lower())
            unique.append(e)
    return unique


async def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--emails", help="Comma-separated emails")
    parser.add_argument("--emails-file", help="Text file with one email per line (# starts a comment)")
    parser.add_argument("--days", type=int, help="Grant length in days. Omit for no end date.")
    parser.add_argument("--revoke", action="store_true", help="Remove Pro instead of granting it")
    parser.add_argument("--apply", action="store_true", help="Write the change (default is a dry run)")
    args = parser.parse_args()

    emails = read_emails(args)
    if not emails:
        parser.error("Provide --emails or --emails-file")
    if args.days is not None and args.days < 1:
        parser.error("--days must be at least 1")

    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]
    repo = UserRepository(db)

    users = await repo.find_by_emails(emails)
    by_email = {u.email.lower(): u for u in users}
    missing = [e for e in emails if e.lower() not in by_email]

    action = "revoke Pro from" if args.revoke else (
        f"grant Pro ({args.days} days)" if args.days else "grant Pro (no end date) to"
    )
    print(f"Database: {settings.MONGODB_DB_NAME}  ({'APPLYING' if args.apply else 'dry run, nothing will change'})")
    print(f"Will {action} {len(users)} user(s):")
    for u in users:
        state = "Pro" if is_pro_active(u) else "Free"
        print(f"  {u.email:<40} currently {state}")
    for e in missing:
        print(f"  {e:<40} NOT FOUND")

    if not args.apply:
        print("\nDry run only. Add --apply to make the change.")
        client.close()
        return 0

    updated = await repo.set_pro_many([u.id for u in users], not args.revoke, days=None if args.revoke else args.days)
    print(f"\nUpdated {updated} user(s).")
    client.close()
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
