import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export type User = {
  id: string;
  github_id: string;
  github_username: string;
  github_email: string | null;
  github_avatar_url: string | null;
  github_access_token: string | null;
  created_at: string;
  updated_at: string;
};

export type Repository = {
  id: string;
  user_id: string;
  github_repo_id: string | null;
  repo_name: string;
  repo_full_name: string | null;
  repo_url: string | null;
  description: string | null;
  is_private: boolean;
  default_branch: string;
  created_at: string;
  updated_at: string;
};

export type Upload = {
  id: string;
  user_id: string;
  repository_id: string | null;
  original_filename: string;
  file_type: string;
  file_size: number | null;
  extracted_files: ExtractedFile[];
  status: 'pending' | 'extracted' | 'pushed' | 'failed';
  created_at: string;
};

export type ExtractedFile = {
  path: string;
  size: number;
  isDirectory: boolean;
  content?: string;
};
