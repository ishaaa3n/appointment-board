from datetime import date as date_type
from datetime import time as time_type

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from . import models, schemas


def find_conflict(
    db: Session,
    appointment_date: date_type,
    start_time: time_type,
    end_time: time_type,
    exclude_id: int | None = None,
) -> models.Appointment | None:
    query = db.query(models.Appointment).filter(
        models.Appointment.date == appointment_date,
        models.Appointment.status != models.AppointmentStatus.cancelled,
        models.Appointment.start_time < end_time,
        models.Appointment.end_time > start_time,
    )
    if exclude_id is not None:
        query = query.filter(models.Appointment.id != exclude_id)
    return query.first()


def raise_if_conflict(
    db: Session,
    appointment_date: date_type,
    start_time: time_type,
    end_time: time_type,
    exclude_id: int | None = None,
) -> None:
    conflict = find_conflict(db, appointment_date, start_time, end_time, exclude_id)
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"This time slot overlaps with \"{conflict.title}\" "
                f"({conflict.start_time.strftime('%H:%M')}-"
                f"{conflict.end_time.strftime('%H:%M')})."
            ),
        )


def create_appointment(
    db: Session, payload: schemas.AppointmentCreate
) -> models.Appointment:
    raise_if_conflict(db, payload.date, payload.start_time, payload.end_time)
    appointment = models.Appointment(**payload.model_dump())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


def get_appointment_or_404(db: Session, appointment_id: int) -> models.Appointment:
    appointment = (
        db.query(models.Appointment)
        .filter(models.Appointment.id == appointment_id)
        .first()
    )
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    return appointment


def update_appointment(
    db: Session, appointment_id: int, payload: schemas.AppointmentUpdate
) -> models.Appointment:
    appointment = get_appointment_or_404(db, appointment_id)
    if appointment.status != models.AppointmentStatus.scheduled:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot edit an appointment that is already {appointment.status.value}.",
        )
    raise_if_conflict(
        db, payload.date, payload.start_time, payload.end_time, exclude_id=appointment_id
    )
    for field, value in payload.model_dump().items():
        setattr(appointment, field, value)
    db.commit()
    db.refresh(appointment)
    return appointment


AppointmentStatus = models.AppointmentStatus

ACTION_TARGET = {
    "complete": AppointmentStatus.completed,
    "miss": AppointmentStatus.missed,
    "cancel": AppointmentStatus.cancelled,
    "restore": AppointmentStatus.scheduled,
}

ACTION_ALLOWED_FROM = {
    "complete": {AppointmentStatus.scheduled, AppointmentStatus.missed},
    "miss": {AppointmentStatus.scheduled, AppointmentStatus.completed},
    "cancel": {
        AppointmentStatus.scheduled,
        AppointmentStatus.completed,
        AppointmentStatus.missed,
    },
    "restore": {
        AppointmentStatus.completed,
        AppointmentStatus.missed,
        AppointmentStatus.cancelled,
    },
}

ACTION_VERB = {
    "complete": "mark as completed",
    "miss": "mark as missed",
    "cancel": "cancel",
    "restore": "restore",
}


def transition_status(
    db: Session, appointment_id: int, action: str
) -> models.Appointment:
    appointment = get_appointment_or_404(db, appointment_id)

    if appointment.status not in ACTION_ALLOWED_FROM[action]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot {ACTION_VERB[action]} an appointment that is "
                f"{appointment.status.value}."
            ),
        )

    target = ACTION_TARGET[action]
    if target == AppointmentStatus.scheduled:
        raise_if_conflict(
            db,
            appointment.date,
            appointment.start_time,
            appointment.end_time,
            exclude_id=appointment.id,
        )

    appointment.status = target
    db.commit()
    db.refresh(appointment)
    return appointment


def list_appointments(
    db: Session, date_filter: date_type | None, status_filter: str | None
) -> list[models.Appointment]:
    query = db.query(models.Appointment)
    if date_filter is not None:
        query = query.filter(models.Appointment.date == date_filter)
    if status_filter is not None:
        query = query.filter(models.Appointment.status == status_filter)
    return query.order_by(
        models.Appointment.date, models.Appointment.start_time
    ).all()
