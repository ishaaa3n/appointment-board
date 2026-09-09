from datetime import date as date_type

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .. import schemas, services
from ..database import get_db
from ..models import AppointmentStatus

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.get("", response_model=list[schemas.AppointmentOut])
def list_appointments(
    date: date_type | None = Query(None, description="Filter by exact date"),
    status: AppointmentStatus | None = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
):
    return services.list_appointments(db, date, status)


@router.post("", response_model=schemas.AppointmentOut, status_code=201)
def create_appointment(
    payload: schemas.AppointmentCreate, db: Session = Depends(get_db)
):
    return services.create_appointment(db, payload)


@router.patch("/{appointment_id}", response_model=schemas.AppointmentOut)
def update_appointment(
    appointment_id: int,
    payload: schemas.AppointmentUpdate,
    db: Session = Depends(get_db),
):
    return services.update_appointment(db, appointment_id, payload)


@router.patch("/{appointment_id}/complete", response_model=schemas.AppointmentOut)
def complete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    return services.transition_status(db, appointment_id, "complete")


@router.patch("/{appointment_id}/miss", response_model=schemas.AppointmentOut)
def miss_appointment(appointment_id: int, db: Session = Depends(get_db)):
    return services.transition_status(db, appointment_id, "miss")


@router.patch("/{appointment_id}/cancel", response_model=schemas.AppointmentOut)
def cancel_appointment(appointment_id: int, db: Session = Depends(get_db)):
    return services.transition_status(db, appointment_id, "cancel")


@router.patch("/{appointment_id}/restore", response_model=schemas.AppointmentOut)
def restore_appointment(appointment_id: int, db: Session = Depends(get_db)):
    return services.transition_status(db, appointment_id, "restore")
