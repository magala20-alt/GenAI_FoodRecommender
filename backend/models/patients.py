# the patients table

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    age = Column(Integer)
    gender = Column(String)
    allergies = Column(String)
    conditions = Column(String)