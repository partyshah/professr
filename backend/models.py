from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, UniqueConstraint, ForeignKey, func
from database import Base

class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String, nullable=False)
    professor_name = Column(String, nullable=False)
    access_code = Column(String(6), unique=True, nullable=False, index=True)
    tutor_prompt = Column(Text, nullable=True)
    evaluation_prompt = Column(Text, nullable=True)
    professor_password = Column(String, nullable=False)

    def __repr__(self):
        return f"<Class(id={self.id}, class_name='{self.class_name}', professor_name='{self.professor_name}', access_code='{self.access_code}')>"

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    class_id = Column(Integer, ForeignKey('classes.id'), nullable=False, index=True)

    def __repr__(self):
        return f"<Student(id={self.id}, name='{self.name}', class_id={self.class_id})>"

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    week_number = Column(Integer, nullable=True)  # Week 1, 2, 3, etc.
    pdf_paths = Column(JSON, nullable=True)  # List of assignment PDF paths, e.g., ["week1/assignment.pdf", "week1/rubric.pdf"]
    solution_pdf_paths = Column(JSON, nullable=True)  # List of solution PDF paths, e.g., ["week1/solution.pdf"]
    reading_text = Column(Text, nullable=True)  # Store reading text directly instead of extracting from PDFs
    class_id = Column(Integer, ForeignKey('classes.id'), nullable=False, index=True)

    def __repr__(self):
        return f"<Assignment(id={self.id}, title='{self.title}', class_id={self.class_id})>"

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, nullable=False)
    assignment_id = Column(Integer, nullable=False)
    status = Column(String, nullable=False)  # 'completed', 'failed'
    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=False)
    full_transcript = Column(JSON, nullable=False)
    final_score = Column(Integer, nullable=True)
    score_category = Column(String, nullable=True)  # 'green', 'yellow', 'red'
    ai_feedback = Column(Text, nullable=True)
    class_id = Column(Integer, ForeignKey('classes.id'), nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint('student_id', 'assignment_id', name='_student_assignment_uc'),
    )

    def __repr__(self):
        return f"<Session(id={self.id}, student_id={self.student_id}, assignment_id={self.assignment_id}, class_id={self.class_id}, status='{self.status}')>"