import time
from app.db.seed import bootstrap_database
print('start', flush=True)
t = time.time()
bootstrap_database()
print('done', round(time.time()-t, 2), flush=True)
