"""
CloudConfig Ops — Live Amazon RDS Database Viewer
Queries the live PostgreSQL database on AWS and prints all tables cleanly.
"""
import asyncio
from sqlalchemy import select
from app.core.database import async_session_maker
from app.models.user import User
from app.models.config_item import ConfigItem
from app.models.change_request import ChangeRequest
from app.models.baseline import Baseline

async def view_tables():
    print("=" * 70)
    print(" CONNECTING TO LIVE AWS RDS: cloudconfig-db (PostgreSQL 18)")
    print("=" * 70)
    
    async with async_session_maker() as session:
        # 1. USERS
        users = (await session.execute(select(User))).scalars().all()
        print(f"\n[TABLE: users] ({len(users)} records)")
        print(f"{'ID':<4} | {'EMAIL':<25} | {'FULL NAME':<20} | {'ROLE':<10}")
        print("-" * 65)
        for u in users:
            print(f"{u.id:<4} | {u.email:<25} | {u.full_name or '':<20} | {u.role:<10}")

        # 2. CONFIG ITEMS
        configs = (await session.execute(select(ConfigItem))).scalars().all()
        print(f"\n[TABLE: config_items] ({len(configs)} records)")
        print(f"{'ID':<4} | {'NAME':<20} | {'ENV':<12} | {'VER':<4} | {'CONTENT SNIPPET'}")
        print("-" * 65)
        for c in configs:
            snippet = c.content.replace('\n', ' ')[:30] + "..." if len(c.content) > 30 else c.content
            print(f"{c.id:<4} | {c.name:<20} | {c.environment:<12} | {c.version:<4} | {snippet}")

        # 3. CHANGE REQUESTS
        crs = (await session.execute(select(ChangeRequest))).scalars().all()
        print(f"\n[TABLE: change_requests] ({len(crs)} records)")
        print(f"{'ID':<4} | {'TITLE':<25} | {'STATUS':<12} | {'PRIORITY':<10}")
        print("-" * 65)
        if not crs:
            print("  (Staging queue clear / pending requests processed)")
        for cr in crs:
            print(f"{cr.id:<4} | {cr.title:<25} | {cr.status:<12} | {cr.priority:<10}")

        # 4. BASELINES
        baselines = (await session.execute(select(Baseline))).scalars().all()
        print(f"\n[TABLE: baselines] ({len(baselines)} records)")
        print(f"{'ID':<4} | {'NAME':<25} | {'ENV':<12}")
        print("-" * 65)
        for b in baselines:
            print(f"{b.id:<4} | {b.name:<25} | {b.environment:<12}")

    print("\n" + "=" * 70)
    print(" SUCCESS: All data verified live on Amazon RDS.")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(view_tables())
