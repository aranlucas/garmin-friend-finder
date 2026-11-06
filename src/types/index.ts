export interface Friend {
  id: string;
  short_name: string;
  latitude: number | null;
  longitude: number | null;
}

export interface LocatedFriend extends Friend {
  latitude: number;
  longitude: number;
}
