from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, UniqueConstraint, func
from database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    
    def __repr__(self):
        return f"<Student(id={self.id}, name='{self.name}')>"

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    week_number = Column(Integer, nullable=True)  # Week 1, 2, 3, etc.
    pdf_paths = Column(JSON, nullable=True)  # List of assignment PDF paths, e.g., ["week1/assignment.pdf", "week1/rubric.pdf"]
    solution_pdf_paths = Column(JSON, nullable=True)  # List of solution PDF paths, e.g., ["week1/solution.pdf"]
    
    def __repr__(self):
        return f"<Assignment(id={self.id}, title='{self.title}')>"

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

    __table_args__ = (
        UniqueConstraint('student_id', 'assignment_id', name='_student_assignment_uc'),
    )
    
    def __repr__(self):
        return f"<Session(id={self.id}, student_id={self.student_id}, assignment_id={self.assignment_id}, status='{self.status}')>"