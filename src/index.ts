import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  match,
  Result,
  nat64,
  ic,
  Opt,
} from "azle";
import { v4 as uuidv4 } from "uuid";

type Restaurant = Record<{
  id: string;
  name: string;
  location: string;
  capacity: number;
  openingHours: {
    start: string;
    end: string;
  };
  tables: Array<{ id: number; available: boolean }>;
}>;

type Reservation = Record<{
  id: string;
  restaurantId: string;
  date: string;
  time: string;
  partySize: number;
  contactInfo: string;
  tableId: number;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

const restaurants: StableBTreeMap<string, Restaurant> = new StableBTreeMap(
  0,
  44,
  1024
);
const reservations: StableBTreeMap<string, Reservation> = new StableBTreeMap(
  0,
  44,
  1024
);

// Restaurants
$query;
export function getRestaurants(): Result<Vec<Restaurant>, string> {
  return Result.Ok(restaurants.values());
}

$query;
export function getRestaurant(id: string): Result<Restaurant, string> {
  const restaurant = restaurants.get(id);

  if (restaurant) {
    return Result.Ok(restaurant);
  } else {
    return Result.Err(`Restaurant with id=${id} not found`);
  }
}

$update;
export function addRestaurant(
  payload: Omit<Restaurant, "id">
): Result<Restaurant, string> {
  const restaurant: Restaurant = {
    id: uuidv4(),
    ...payload,
  };
  restaurants.insert(restaurant.id, restaurant);
  return Result.Ok(restaurant);
}

$update;
export function updateRestaurant(
  id: string,
  payload: Omit<Restaurant, "id">
): Result<Restaurant, string> {
  const existingRestaurant = restaurants.get(id);

  if (existingRestaurant) {
    const updatedRestaurant: Restaurant = {
      ...existingRestaurant,
      ...payload,
    };
    restaurants.insert(updatedRestaurant.id, updatedRestaurant);
    return Result.Ok(updatedRestaurant);
  } else {
    return Result.Err(`Restaurant with id=${id} not found`);
  }
}

$update;
export function deleteRestaurant(id: string): Result<Restaurant, string> {
  const existingRestaurant = restaurants.remove(id);

  if (existingRestaurant) {
    return Result.Ok(existingRestaurant);
  } else {
    return Result.Err(`Restaurant with id=${id} not found`);
  }
}

// Reservations
$query;
export function getReservations(): Result<Vec<Reservation>, string> {
  return Result.Ok(reservations.values());
}

$query;
export function getReservation(id: string): Result<Reservation, string> {
  const reservation = reservations.get(id);

  if (reservation) {
    return Result.Ok(reservation);
  } else {
    return Result.Err(`Reservation with id=${id} not found`);
  }
}

$update;
export function createReservation(
  payload: Omit<Reservation, "id">
): Result<Reservation, string> {
  // Availability check and table assignment logic
  // ...

  const reservation: Reservation = {
    id: uuidv4(),
    ...payload,
    status: "pending",
    createdAt: ic.time(),
    updatedAt: Opt.None,
  };
  reservations.insert(reservation.id, reservation);
  return Result.Ok(reservation);
}

$update;
export function updateReservation(
  id: string,
  payload: Omit<Reservation, "id" | "createdAt">
): Result<Reservation, string> {
  const existingReservation = reservations.get(id);

  if (existingReservation) {
    const updatedReservation: Reservation = {
      ...existingReservation,
      ...payload,
      updatedAt: Opt.Some(ic.time()),
    };
    reservations.insert(id, updatedReservation);
    return Result.Ok(updatedReservation);
  } else {
    return Result.Err(`Reservation with id=${id} not found`);
  }
}

$update;
export function cancelReservation(id: string): Result<Reservation, string> {
  const existingReservation = reservations.get(id);

  if (existingReservation) {
    const cancelledReservation: Reservation = {
      ...existingReservation,
      status: "cancelled",
      updatedAt: Opt.Some(ic.time()),
    };
    reservations.insert(id, cancelledReservation);
    return Result.Ok(cancelledReservation);
  } else {
    return Result.Err(`Reservation with id=${id} not found`);
  }
}

// a workaround to make uuid package work with Azle
globalThis.crypto = {
  // @ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
