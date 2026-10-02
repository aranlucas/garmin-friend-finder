export interface Friend {
  id: string;
  short_name: string;
  latitude: number;
  longitude: number;
}

export interface FriendWithOptionalLocation extends Omit<Friend, "latitude" | "longitude"> {
  latitude: number | null;
  longitude: number | null;
}

export interface FriendBearingInfo {
  id: string;
  short_name: string;
  bearing: number;
}
