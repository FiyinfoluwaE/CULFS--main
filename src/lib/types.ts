export interface ApiListResponse<T> {
  items: T[];
  success?: boolean;
}

export interface AdminStats {
  total_lost: number;
  total_found: number;
  total_claimed: number;
  total_matched: number;
  total_archived: number;
  success?: boolean;
}

export interface LostItemNameResponse {
  names: string[];
  success?: boolean;
}

export interface ApiResult {
  success?: boolean;
  message?: string;
  user?: Record<string, any>;
  user_id?: string;
  notifications?: Record<string, any>[];
}

export interface UserPayload {
  name: string;
  role: string;
  email: string;
  password: string;
  matricNo?: string;
  staffId?: string;
  credentials?: string;
  department?: string;
  level?: string;
}

export interface RegisterResponse extends ApiResult {
  user_id?: string;
}
