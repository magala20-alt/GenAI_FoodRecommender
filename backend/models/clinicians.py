# Clinician table
class Clinician(Base):
    __tablename__ = "clinicians"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True)
    password_hash = Column(String)

