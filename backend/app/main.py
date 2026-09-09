from datetime import date, timedelta, time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import Base, SessionLocal, engine
from .routers import appointments

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Appointment Board API",
    description="A small REST API for managing a team's appointments.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(appointments.router)


@app.get("/health")
def health():
    return {"status": "ok"}


def seed_if_empty():
    db = SessionLocal()
    try:
        if db.query(models.Appointment).count() > 0:
            return

        today = date.today()
        day_minus_1 = today - timedelta(days=1)
        day_plus_1 = today + timedelta(days=1)
        day_plus_2 = today + timedelta(days=2)

        seed_data = [
            # Yesterday — 3 appointments, including a missed one and an
            # overdue appointment that was never resolved
            dict(
                title="Investor Check-in",
                description="Monthly update call with the seed investor.",
                date=day_minus_1,
                start_time=time(9, 0),
                end_time=time(9, 30),
                status=models.AppointmentStatus.missed,
            ),
            dict(
                title="Design Review",
                description="Review the new onboarding flow mockups with design.",
                date=day_minus_1,
                start_time=time(11, 0),
                end_time=time(12, 0),
                status=models.AppointmentStatus.completed,
            ),
            dict(
                title="Client Follow-up",
                description="Follow up on the proposal sent last week.",
                date=day_minus_1,
                start_time=time(16, 0),
                end_time=time(16, 30),
                status=models.AppointmentStatus.scheduled,
            ),
            # Today — 4 appointments, all three statuses
            dict(
                title="Client Discovery Call",
                description="Intro call with a prospective client to scope requirements.",
                date=today,
                start_time=time(9, 0),
                end_time=time(9, 30),
                status=models.AppointmentStatus.scheduled,
            ),
            dict(
                title="Sprint Planning",
                description="Plan the next two-week sprint with the engineering team.",
                date=today,
                start_time=time(10, 0),
                end_time=time(11, 0),
                status=models.AppointmentStatus.scheduled,
            ),
            dict(
                title="Candidate Interview",
                description="Technical interview for the backend engineer role.",
                date=today,
                start_time=time(13, 0),
                end_time=time(14, 0),
                status=models.AppointmentStatus.completed,
            ),
            dict(
                title="Vendor Renewal Call",
                description="Discuss renewal terms with the cloud hosting vendor.",
                date=today,
                start_time=time(15, 0),
                end_time=time(15, 30),
                status=models.AppointmentStatus.cancelled,
            ),
            # Tomorrow — 3 appointments
            dict(
                title="Marketing Sync",
                description="Weekly sync with the marketing team on campaign status.",
                date=day_plus_1,
                start_time=time(9, 30),
                end_time=time(10, 0),
                status=models.AppointmentStatus.scheduled,
            ),
            dict(
                title="Onboarding Call",
                description="Walkthrough call for a new customer's onboarding.",
                date=day_plus_1,
                start_time=time(11, 0),
                end_time=time(11, 30),
                status=models.AppointmentStatus.cancelled,
            ),
            dict(
                title="Product Demo",
                description="Demo the latest release to the product stakeholders.",
                date=day_plus_1,
                start_time=time(14, 0),
                end_time=time(15, 0),
                status=models.AppointmentStatus.scheduled,
            ),
            # Day after tomorrow — 2 appointments
            dict(
                title="Quarterly Review",
                description="Review quarterly goals and metrics with leadership.",
                date=day_plus_2,
                start_time=time(10, 0),
                end_time=time(11, 30),
                status=models.AppointmentStatus.scheduled,
            ),
            dict(
                title="1:1 with Manager",
                description="Regular one-on-one check-in.",
                date=day_plus_2,
                start_time=time(15, 30),
                end_time=time(16, 0),
                status=models.AppointmentStatus.completed,
            ),
        ]

        for row in seed_data:
            db.add(models.Appointment(**row))
        db.commit()
    finally:
        db.close()


@app.on_event("startup")
def on_startup():
    seed_if_empty()
