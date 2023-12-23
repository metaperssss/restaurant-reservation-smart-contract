/* eslint-disable @typescript-eslint/no-unused-expressions */
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
  Principal,
} from 'azle';
import { Variant } from 'azle';
import { v4 as uuidv4 } from 'uuid';

type OpeningHours = Record<{
  start: string;
  end: string;
}>;

type Table = Record<{
  id: number;
  available: boolean;
}>;

type Restaurant = Record<{
  id: string;
  name: string;
  location: string;
  capacity: number;
  openingHours: OpeningHours;
  tables: Vec<Table>;
}>;

type RestaurantPayload = Record<{
  name: string;
  location: string;
  capacity: number;
  openingHours: OpeningHours;
  tables: Vec<Table>;
}>;

type ReservationStatus = Variant<{
  pending: null;
  confirmed: null;
  cancelled: null;
}>;

type Reservation = Record<{
  id: string;
  restaurantId: string;
  date: string;
  time: string;
  partySize: number;
  contactInfo: string;
  tableId: number;
  status: ReservationStatus;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

type ReservationPayload = Record<{
  restaurantId: string;
  date: string;
  time: string;
  partySize: number;
  contactInfo: string;
  tableId: number;
  status: ReservationStatus;
}>;

const restaurants = new StableBTreeMap<string, Restaurant>(0, 44, 1024);
const reservations = new StableBTreeMap<string, Reservation>(1, 44, 1024);

// Restaurants
$query;
export function getRestaurants(): Result<Vec<Restaurant>, string> {
  try {
    return Result.Ok(restaurants.values());
  } catch (error) {
    return Result.Err(`Error retrieving restaurants: ${error}`);
  }
}

$query;
export function getRestaurant(id: string): Result<Restaurant, string> {
  try {
    if (typeof id !== 'string') {
      return Result.Err(`Invalid ID parameter.`);
    }

    return match(restaurants.get(id), {
      Some: (restaurant) => Result.Ok<Restaurant, string>(restaurant),
      None: () =>
        Result.Err<Restaurant, string>(`Restaurant with ID=${id} not found`),
    });
  } catch (error) {
    return Result.Err(`Error retrieving restaurant by ID: ${error}`);
  }
}

$update;
export function addRestaurant(
  payload: RestaurantPayload
): Result<Restaurant, string> {
  try {
    // Payload Validation
    if (
      !payload.name ||
      !payload.location ||
      !payload.capacity ||
      !payload.openingHours ||
      !payload.tables
    ) {
      return Result.Err<Restaurant, string>('Invalid payload');
    }

    // Create a new restaurant record
    const restaurant: Restaurant = {
      id: uuidv4(),
      name: payload.name,
      location: payload.location,
      capacity: payload.capacity,
      openingHours: payload.openingHours,
      tables: payload.tables,
    };

    restaurants.insert(restaurant.id, restaurant);
    return Result.Ok(restaurant);
  } catch (error) {
    return Result.Err(`Failed to add restaurant: ${error}`);
  }
}

$update;
export function updateRestaurant(
  id: string,
  payload: RestaurantPayload
): Result<Restaurant, string> {
  try {
    if (typeof id !== 'string') {
      return Result.Err(`Invalid ID parameter.`);
    }

    // Payload Validation
    if (
      !payload.name ||
      !payload.location ||
      !payload.capacity ||
      !payload.openingHours ||
      !payload.tables
    ) {
      return Result.Err<Restaurant, string>('Invalid payload');
    }

    return match(restaurants.get(id), {
      Some: (existingRestaurant) => {
        // Set each property individually
        const updatedRestaurant: Restaurant = {
          id: existingRestaurant.id,
          name: payload.name,
          location: payload.location,
          capacity: payload.capacity,
          openingHours: payload.openingHours,
          tables: payload.tables,
        };

        restaurants.insert(updatedRestaurant.id, updatedRestaurant);
        return Result.Ok<Restaurant, string>(updatedRestaurant);
      },
      None: () =>
        Result.Err<Restaurant, string>(`Restaurant with ID=${id} not found`),
    });
  } catch (error) {
    return Result.Err(`Failed to update restaurant: ${error}`);
  }
}

$update;
export function deleteRestaurant(id: string): Result<Restaurant, string> {
  try {
    if (typeof id !== 'string') {
      return Result.Err(`Invalid ID parameter.`);
    }

    return match(restaurants.remove(id), {
      Some: (deletedRestaurant) =>
        Result.Ok<Restaurant, string>(deletedRestaurant),
      None: () =>
        Result.Err<Restaurant, string>(`Restaurant with ID=${id} not found`),
    });
  } catch (error) {
    return Result.Err(`Failed to delete restaurant: ${error}`);
  }
}

// Reservations
$query;
export function getReservations(): Result<Vec<Reservation>, string> {
  try {
    return Result.Ok(reservations.values());
  } catch (error) {
    return Result.Err(`Error retrieving reservations: ${error}`);
  }
}

$query;
export function getReservation(id: string): Result<Reservation, string> {
  try {
    if (typeof id !== 'string') {
      return Result.Err(`Invalid ID parameter.`);
    }

    return match(reservations.get(id), {
      Some: (reservation) => Result.Ok<Reservation, string>(reservation),
      None: () =>
        Result.Err<Reservation, string>(`Reservation with ID=${id} not found`),
    });
  } catch (error) {
    return Result.Err(`Error retrieving reservation by ID: ${error}`);
  }
}

$update;
export function createReservation(
  payload: ReservationPayload
): Result<Reservation, string> {
  try {
    // Availability check and table assignment logic
    // ...

    // Payload Validation
    if (
      !payload.restaurantId ||
      !payload.date ||
      !payload.time ||
      !payload.partySize ||
      !payload.contactInfo ||
      !payload.tableId ||
      !payload.status
    ) {
      return Result.Err<Reservation, string>('Invalid payload');
    }

    const reservation: Reservation = {
      id: uuidv4(),
      restaurantId: payload.restaurantId,
      date: payload.date,
      time: payload.time,
      partySize: payload.partySize,
      contactInfo: payload.contactInfo,
      tableId: payload.tableId,
      status: payload.status,
      createdAt: ic.time(),
      updatedAt: Opt.None,
    };

    reservations.insert(reservation.id, reservation);
    return Result.Ok(reservation);
  } catch (error) {
    return Result.Err(`Failed to create reservation: ${error}`);
  }
}

$update;
export function updateReservation(
  id: string,
  payload: ReservationPayload
): Result<Reservation, string> {
  try {
    if (typeof id !== 'string') {
      return Result.Err(`Invalid ID parameter.`);
    }

    // Payload Validation
    if (
      !payload.restaurantId ||
      !payload.date ||
      !payload.time ||
      !payload.partySize ||
      !payload.contactInfo ||
      !payload.tableId ||
      !payload.status
    ) {
      return Result.Err<Reservation, string>('Invalid payload');
    }

    return match(reservations.get(id), {
      Some: (existingReservation) => {
        // Set each property individually
        const updatedReservation: Reservation = {
          id: existingReservation.id,
          restaurantId: payload.restaurantId,
          date: payload.date,
          time: payload.time,
          partySize: payload.partySize,
          contactInfo: payload.contactInfo,
          tableId: payload.tableId,
          status: payload.status,
          createdAt: existingReservation.createdAt,
          updatedAt: Opt.Some(ic.time()),
        };

        reservations.insert(id, updatedReservation);
        return Result.Ok<Reservation, string>(updatedReservation);
      },
      None: () =>
        Result.Err<Reservation, string>(`Reservation with ID=${id} not found`),
    });
  } catch (error) {
    return Result.Err(`Failed to update reservation: ${error}`);
  }
}

$update;
export function cancelReservation(id: string): Result<Reservation, string> {
  try {
    if (typeof id !== 'string') {
      return Result.Err(`Invalid ID parameter.`);
    }

    return match(reservations.get(id), {
      Some: (existingReservation) => {
        // Set each property individually
        const cancelledReservation: Reservation = {
          ...existingReservation,
          status: { cancelled: null },
          updatedAt: Opt.Some(ic.time()),
        };

        reservations.insert(id, cancelledReservation);
        return Result.Ok<Reservation, string>(cancelledReservation);
      },
      None: () =>
        Result.Err<Reservation, string>(`Reservation with ID=${id} not found`),
    });
  } catch (error) {
    return Result.Err(`Failed to cancel reservation: ${error}`);
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
