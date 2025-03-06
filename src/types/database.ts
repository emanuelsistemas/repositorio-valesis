export interface Group {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface Subgroup {
  id: string;
  name: string;
  group_id: string;
  user_id: string;
  created_at: string;
}

export interface File {
  id: string;
  name: string;
  link: string;
  subgroup_id: string;
  user_id: string;
  created_at: string;
}