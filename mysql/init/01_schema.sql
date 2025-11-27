CREATE DATABASE IF NOT EXISTS zju_graduate_art_troupe DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE zju_graduate_art_troupe;

CREATE TABLE images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kind ENUM('profile','performance') NOT NULL,
  performance_id BIGINT UNSIGNED NULL,
  uploader_id BIGINT UNSIGNED NULL,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(64) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  data LONGBLOB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ,CONSTRAINT fk_images_perf FOREIGN KEY (performance_id) REFERENCES performance_projects(id) ON DELETE CASCADE
  ,CONSTRAINT fk_images_uploader FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE colleges (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE troupe_groups (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role ENUM('member','admin') NOT NULL,
  name VARCHAR(64) NOT NULL,
  gender ENUM('male','female') NOT NULL,
  birthday DATE NOT NULL,
  student_no VARCHAR(32) NOT NULL UNIQUE,
  college_id BIGINT UNSIGNED NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NULL,
  join_year YEAR NOT NULL,
  profile_photo_id BIGINT UNSIGNED NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_college FOREIGN KEY (college_id) REFERENCES colleges(id),
  CONSTRAINT fk_users_photo FOREIGN KEY (profile_photo_id) REFERENCES images(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_groups (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  role ENUM('leader','deputy','member') NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  CONSTRAINT fk_user_groups_group FOREIGN KEY (group_id) REFERENCES troupe_groups(id),
  CONSTRAINT fk_user_groups_user FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY uk_user_groups (group_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE attendance_projects (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(128) NOT NULL,
  location VARCHAR(128) NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NULL,
  status ENUM('draft','open','closed','archived') NOT NULL DEFAULT 'open',
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_att_proj_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE attendance_applications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_att_app_proj FOREIGN KEY (project_id) REFERENCES attendance_projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_app_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_att_app (project_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE attendance_participants (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  source ENUM('application','assigned') NOT NULL,
  assigned_by BIGINT UNSIGNED NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_att_part_proj FOREIGN KEY (project_id) REFERENCES attendance_projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_part_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_part_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uk_att_part (project_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE attendance_records (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('normal','late','absent','leave') NOT NULL,
  reason VARCHAR(255) NULL,
  checkin_time DATETIME NULL,
  recorded_by BIGINT UNSIGNED NOT NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_att_rec_proj FOREIGN KEY (project_id) REFERENCES attendance_projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_rec_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_rec_by FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uk_att_rec (project_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE performance_projects (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  location VARCHAR(128) NOT NULL,
  performance_time DATETIME NOT NULL,
  rehearsal_time DATETIME NULL,
  signup_start DATETIME NULL,
  signup_end DATETIME NULL,
  status ENUM('draft','open','closed','archived') NOT NULL DEFAULT 'open',
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_perf_proj_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE performance_applications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_perf_app_proj FOREIGN KEY (project_id) REFERENCES performance_projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_perf_app_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_perf_app (project_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE performance_participants (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  source ENUM('application','assigned') NOT NULL,
  selected_by BIGINT UNSIGNED NULL,
  selected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_perf_part_proj FOREIGN KEY (project_id) REFERENCES performance_projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_perf_part_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_perf_part_by FOREIGN KEY (selected_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uk_perf_part (project_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE performance_programs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(128) NOT NULL,
  type VARCHAR(64) NOT NULL,
  duration_seconds INT UNSIGNED NOT NULL,
  program_order INT UNSIGNED NOT NULL,
  remarks VARCHAR(255) NULL,
  contact_phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_perf_prog_project FOREIGN KEY (project_id) REFERENCES performance_projects(id) ON DELETE CASCADE,
  UNIQUE KEY uk_perf_prog_order (project_id, program_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE performance_program_performers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  program_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  role VARCHAR(64) NULL,
  remarks VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_perf_prog_perf_program FOREIGN KEY (program_id) REFERENCES performance_programs(id) ON DELETE CASCADE,
  CONSTRAINT fk_perf_prog_perf_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_perf_prog_perf (program_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_users_college_year ON users (college_id, join_year);
CREATE INDEX idx_users_name ON users (name);
CREATE INDEX idx_users_phone ON users (phone);

CREATE INDEX idx_att_proj_time ON attendance_projects (start_time);
CREATE INDEX idx_att_rec_status ON attendance_records (status);
CREATE INDEX idx_att_rec_proj_status ON attendance_records (project_id, status);

CREATE INDEX idx_perf_proj_time ON performance_projects (performance_time, rehearsal_time);
CREATE INDEX idx_perf_app_status ON performance_applications (status);
CREATE INDEX idx_perf_app_proj_status ON performance_applications (project_id, status);

CREATE INDEX idx_images_kind_perf ON images (kind, performance_id);
CREATE INDEX idx_images_uploader ON images (uploader_id);
CREATE INDEX idx_images_perf ON images (performance_id);

CREATE INDEX idx_perf_prog_project_order ON performance_programs (project_id, program_order);
CREATE INDEX idx_perf_prog_type ON performance_programs (type);
CREATE INDEX idx_prog_perf_user ON performance_program_performers (user_id);
CREATE INDEX idx_user_groups_user ON user_groups (user_id);
CREATE INDEX idx_user_groups_group_role ON user_groups (group_id, role);
