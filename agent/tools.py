import json

from langchain.tools import tool


# --- Mock database for demonstration ---

_FLIGHTS = [
    {"flight_id": "AA123", "origin": "SFO", "destination": "NYC", "date": "2026-04-10", "departure": "10:00", "arrival": "18:30", "price": 299, "available_seats": 4},
    {"flight_id": "AA456", "origin": "SFO", "destination": "NYC", "date": "2026-04-10", "departure": "14:00", "arrival": "22:30", "price": 249, "available_seats": 2},
    {"flight_id": "UA789", "origin": "NYC", "destination": "LAX", "date": "2026-04-12", "departure": "08:00", "arrival": "11:00", "price": 199, "available_seats": 10},
    {"flight_id": "DL001", "origin": "LAX", "destination": "SFO", "date": "2026-04-15", "departure": "16:00", "arrival": "17:30", "price": 129, "available_seats": 7},
]

_RESERVATIONS: dict[str, dict] = {}

_USER_PROFILES: dict[str, dict] = {
    "emma_kim_9957": {
        "user_id": "emma_kim_9957",
        "name": "Emma Kim",
        "membership_tier": "regular",
        "reservations": ["EHGLP3"],
    }
}


@tool
def search_flights(origin: str, destination: str, date: str) -> str:
    """Search for available flights between two cities on a given date.

    Args:
        origin: Departure airport code (e.g. "SFO")
        destination: Arrival airport code (e.g. "NYC")
        date: Date in YYYY-MM-DD format

    Returns:
        JSON string with matching flights
    """
    results = [
        f for f in _FLIGHTS
        if f["origin"].upper() == origin.upper()
        and f["destination"].upper() == destination.upper()
        and f["date"] == date
        and f["available_seats"] > 0
    ]
    return json.dumps(results, indent=2)


@tool
def get_user_profile(user_id: str) -> str:
    """Look up a user's profile and membership information.

    Args:
        user_id: The user's unique identifier

    Returns:
        JSON string with user profile data
    """
    profile = _USER_PROFILES.get(user_id)
    if not profile:
        return json.dumps({"error": f"User {user_id} not found"})
    return json.dumps(profile, indent=2)


@tool
def get_reservation(reservation_id: str) -> str:
    """Look up an existing reservation by its ID.

    Args:
        reservation_id: The reservation code (e.g. "EHGLP3")

    Returns:
        JSON string with reservation details
    """
    res = _RESERVATIONS.get(reservation_id)
    if not res:
        return json.dumps({"error": f"Reservation {reservation_id} not found"})
    return json.dumps(res, indent=2)


@tool
def book_flight(user_id: str, flight_id: str, passengers: int) -> str:
    """Book a flight for a user.

    Args:
        user_id: The user's unique identifier
        flight_id: The flight to book (e.g. "AA123")
        passengers: Number of passengers

    Returns:
        JSON string with reservation confirmation
    """
    flight = next((f for f in _FLIGHTS if f["flight_id"] == flight_id), None)
    if not flight:
        return json.dumps({"error": f"Flight {flight_id} not found"})
    if flight["available_seats"] < passengers:
        return json.dumps({"error": f"Not enough seats. Available: {flight['available_seats']}"})

    reservation_id = f"RES{len(_RESERVATIONS) + 1:04d}"
    _RESERVATIONS[reservation_id] = {
        "reservation_id": reservation_id,
        "user_id": user_id,
        "flight_id": flight_id,
        "origin": flight["origin"],
        "destination": flight["destination"],
        "date": flight["date"],
        "passengers": passengers,
        "total_price": flight["price"] * passengers,
        "status": "confirmed",
    }
    flight["available_seats"] -= passengers
    return json.dumps(_RESERVATIONS[reservation_id], indent=2)


@tool
def cancel_reservation(reservation_id: str, user_id: str) -> str:
    """Cancel an existing reservation. Only allowed within 24 hours of booking.

    Args:
        reservation_id: The reservation code to cancel
        user_id: The user requesting cancellation (for verification)

    Returns:
        JSON string with cancellation result
    """
    res = _RESERVATIONS.get(reservation_id)
    if not res:
        return json.dumps({"error": f"Reservation {reservation_id} not found"})
    if res["user_id"] != user_id:
        return json.dumps({"error": "Reservation does not belong to this user"})
    if res["status"] == "cancelled":
        return json.dumps({"error": "Reservation is already cancelled"})

    res["status"] = "cancelled"
    flight = next(f for f in _FLIGHTS if f["flight_id"] == res["flight_id"])
    flight["available_seats"] += res["passengers"]
    return json.dumps({"status": "cancelled", "reservation_id": reservation_id})


ALL_TOOLS = [search_flights, get_user_profile, get_reservation, book_flight, cancel_reservation]
