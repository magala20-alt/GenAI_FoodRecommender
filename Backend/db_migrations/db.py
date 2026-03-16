from app.db.seed import bootstrap_database


if __name__ == "__main__":
	bootstrap_database()
	print("Database tables created and demo data seeded.")
