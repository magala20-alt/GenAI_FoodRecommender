from fastapi import FastAPI
from database import engine
from models import Base

app = FastAPI()

# to create tables on the models folder.
Base.metadata.create_all(bind=engine)

# use this: uvicorn backend_main:app --reload to start the server