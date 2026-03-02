-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : lun. 02 mars 2026 à 16:35
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `edusol_25`
--

-- --------------------------------------------------------

--
-- Structure de la table `administrators`
--

CREATE TABLE `administrators` (
  `id` int(11) NOT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `birthday` date DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `nationality` varchar(255) DEFAULT NULL,
  `picture` varchar(255) DEFAULT NULL,
  `statut` int(11) DEFAULT 1,
  `company_id` int(11) NOT NULL,
  `class_room_id` int(11) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `attestations`
--

CREATE TABLE `attestations` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` longtext DEFAULT NULL,
  `statut` int(11) DEFAULT 1,
  `companyid` int(11) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `classes`
--

CREATE TABLE `classes` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` longtext DEFAULT NULL,
  `statut` int(11) DEFAULT 1,
  `company_id` int(11) NOT NULL,
  `program_id` int(11) NOT NULL,
  `specialization_id` int(11) NOT NULL,
  `level_id` int(11) NOT NULL,
  `school_year_id` int(11) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `classroom_types`
--

CREATE TABLE `classroom_types` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `statut` int(11) DEFAULT 1,
  `company_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `class_courses`
--

CREATE TABLE `class_courses` (
  `id` int(11) NOT NULL,
  `description` longtext DEFAULT NULL,
  `status` int(11) DEFAULT 1,
  `company_id` int(11) NOT NULL,
  `level_id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `volume` int(11) DEFAULT NULL,
  `weekly_frequency` int(11) NOT NULL DEFAULT 1,
  `allday` tinyint(4) NOT NULL DEFAULT 0,
  `duration` int(11) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `class_rooms`
--

CREATE TABLE `class_rooms` (
  `id` int(11) NOT NULL,
  `code` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `classroom_type_id` int(11) DEFAULT NULL,
  `capacity` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `statut` int(11) DEFAULT 1,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `class_students`
--

CREATE TABLE `class_students` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `statut` int(11) DEFAULT 1,
  `tri` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `companies`
--

CREATE TABLE `companies` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `codePostal` varchar(255) DEFAULT NULL,
  `primary_color` varchar(7) DEFAULT NULL,
  `secondary_color` varchar(7) DEFAULT NULL,
  `tertiary_color` varchar(7) DEFAULT NULL,
  `statut` int(11) DEFAULT 1,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `entete_1` text DEFAULT NULL,
  `entete_2` text DEFAULT NULL,
  `entete_3` text DEFAULT NULL,
  `pied_1` text DEFAULT NULL,
  `pied_2` text DEFAULT NULL,
  `pied_3` text DEFAULT NULL,
  `logo_left` tinyint(4) NOT NULL DEFAULT 1,
  `logo_right` tinyint(4) NOT NULL DEFAULT 0,
  `papier_entete` tinyint(4) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `companies`
--

INSERT INTO `companies` (`id`, `name`, `logo`, `email`, `phone`, `city`, `country`, `address`, `codePostal`, `primary_color`, `secondary_color`, `tertiary_color`, `statut`, `created_at`, `updated_at`, `entete_1`, `entete_2`, `entete_3`, `pied_1`, `pied_2`, `pied_3`, `logo_left`, `logo_right`, `papier_entete`) VALUES
(1, 'Test', '/uploads/1/company/1772452768150_logo-removebg-preview.png', 'walidbirori@gmail.com', '+212655996022', 'Safi', 'Morocco', '40 RUE ELOUALIDIA LOTIS EL MAJD QU OUED EL BACHA SAFI', '45000', NULL, NULL, NULL, 1, '2026-03-02 11:54:48.061110', '2026-03-02 13:28:23.000000', '<p>header 112</p>', '<p>header 2</p>', '<p>header 3</p>', '<p>footer 1</p>', '<p>footer 2</p>', '<p>footer 3</p>', 1, 1, 1);

-- --------------------------------------------------------

--
-- Structure de la table `courses`
--

CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `intitule` varchar(255) NOT NULL,
  `description` longtext DEFAULT NULL,
  `volume` int(11) DEFAULT NULL,
  `coefficient` double DEFAULT NULL,
  `pdf_file` varchar(255) DEFAULT NULL,
  `statut` tinyint(4) NOT NULL DEFAULT 1,
  `company_id` int(11) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `levels`
--

CREATE TABLE `levels` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` longtext DEFAULT NULL,
  `pdf_file` varchar(255) DEFAULT NULL,
  `level` int(11) NOT NULL DEFAULT 1,
  `status` int(11) NOT NULL DEFAULT 1,
  `company_id` int(11) NOT NULL,
  `specialization_id` int(11) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `level_pricings`
--

CREATE TABLE `level_pricings` (
  `id` int(11) NOT NULL,
  `level_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `occurrences` int(11) NOT NULL DEFAULT 1,
  `every_month` tinyint(4) NOT NULL DEFAULT 0,
  `company_id` int(11) NOT NULL,
  `statut` int(11) NOT NULL DEFAULT 2,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `modules`
--

CREATE TABLE `modules` (
  `id` int(11) NOT NULL,
  `intitule` varchar(255) NOT NULL,
  `description` longtext DEFAULT NULL,
  `volume` int(11) DEFAULT NULL,
  `coefficient` double DEFAULT NULL,
  `pdf_file` varchar(255) DEFAULT NULL,
  `statut` tinyint(4) NOT NULL DEFAULT 1,
  `company_id` int(11) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `module_course`
--

CREATE TABLE `module_course` (
  `module_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `tri` int(11) NOT NULL DEFAULT 0,
  `volume` int(11) DEFAULT NULL,
  `coefficient` double DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `pages`
--

CREATE TABLE `pages` (
  `id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `route` varchar(255) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `pages`
--

INSERT INTO `pages` (`id`, `title`, `route`, `created_at`, `updated_at`) VALUES
(1, 'Dashboard', '/dashboard', '2026-03-02 11:53:58.299510', '2026-03-02 11:53:58.299510'),
(2, 'Users', '/users', '2026-03-02 11:53:58.303153', '2026-03-02 11:53:58.303153'),
(3, 'Companies', '/companies', '2026-03-02 11:53:58.306399', '2026-03-02 11:53:58.306399'),
(4, 'Settings', '/settings', '2026-03-02 11:53:58.308734', '2026-03-02 11:53:58.308734'),
(5, 'Page Access Management', '/settings/access', '2026-03-02 11:53:58.310286', '2026-03-02 11:53:58.310286'),
(6, 'Roles Management', '/settings/roles', '2026-03-02 11:53:58.311371', '2026-03-02 11:53:58.311371'),
(7, 'Color Settings', '/settings/colors', '2026-03-02 11:53:58.312373', '2026-03-02 11:53:58.312373'),
(8, 'Company Settings', '/settings/company', '2026-03-02 11:53:58.313489', '2026-03-02 11:53:58.313489'),
(9, 'User Settings', '/settings/user', '2026-03-02 11:53:58.314903', '2026-03-02 11:53:58.314903'),
(10, 'Types Settings', '/settings/types', '2026-03-02 11:53:58.315983', '2026-03-02 11:53:58.315983'),
(11, 'Link Types', '/settings/types/link', '2026-03-02 11:53:58.316915', '2026-03-02 11:53:58.316915'),
(12, 'Classroom Types', '/settings/types/classroom', '2026-03-02 11:53:58.317849', '2026-03-02 11:53:58.317849'),
(13, 'Planning Session Types', '/settings/types/planning', '2026-03-02 11:53:58.318668', '2026-03-02 11:53:58.318668'),
(14, 'Administrators', '/administrators', '2026-03-02 11:53:58.319380', '2026-03-02 11:53:58.319380'),
(15, 'Students', '/students', '2026-03-02 11:53:58.320227', '2026-03-02 11:53:58.320227'),
(16, 'Teachers', '/teachers', '2026-03-02 11:53:58.321270', '2026-03-02 11:53:58.321270'),
(17, 'Courses', '/courses', '2026-03-02 11:53:58.322331', '2026-03-02 11:53:58.322331'),
(18, 'Modules', '/modules', '2026-03-02 11:53:58.323078', '2026-03-02 11:53:58.323078'),
(19, 'Classes', '/classes', '2026-03-02 11:53:58.323810', '2026-03-02 11:53:58.323810'),
(20, 'Class Rooms', '/class-rooms', '2026-03-02 11:53:58.324884', '2026-03-02 11:53:58.324884'),
(21, 'Class Students', '/class-students', '2026-03-02 11:53:58.325826', '2026-03-02 11:53:58.325826'),
(22, 'Class Courses', '/class-courses', '2026-03-02 11:53:58.326525', '2026-03-02 11:53:58.326525'),
(23, 'School Years', '/school-years', '2026-03-02 11:53:58.327376', '2026-03-02 11:53:58.327376'),
(24, 'School Year Periods', '/school-year-periods', '2026-03-02 11:53:58.328092', '2026-03-02 11:53:58.328092'),
(25, 'Programs', '/programs', '2026-03-02 11:53:58.328730', '2026-03-02 11:53:58.328730'),
(26, 'Levels', '/levels', '2026-03-02 11:53:58.329346', '2026-03-02 11:53:58.329346'),
(27, 'Specializations', '/specializations', '2026-03-02 11:53:58.329965', '2026-03-02 11:53:58.329965'),
(28, 'Planning', '/planning', '2026-03-02 11:53:58.330591', '2026-03-02 11:53:58.330591'),
(29, 'Planning Session Types', '/planning-session-types', '2026-03-02 11:53:58.331334', '2026-03-02 11:53:58.331334'),
(30, 'Student Presence', '/student-presence', '2026-03-02 11:53:58.332061', '2026-03-02 11:53:58.332061'),
(31, 'Student Reports', '/student-reports', '2026-03-02 11:53:58.332697', '2026-03-02 11:53:58.332697'),
(32, 'Student Report Details', '/student-report-details', '2026-03-02 11:53:58.333307', '2026-03-02 11:53:58.333307'),
(33, 'Student Payments', '/student-payments', '2026-03-02 11:53:58.333921', '2026-03-02 11:53:58.333921'),
(34, 'Level Pricings', '/level-pricings', '2026-03-02 11:53:58.334606', '2026-03-02 11:53:58.334606'),
(35, 'Student Attestations', '/student-attestations', '2026-03-02 11:53:58.335229', '2026-03-02 11:53:58.335229'),
(36, 'Attestations', '/attestations', '2026-03-02 11:53:58.335843', '2026-03-02 11:53:58.335843'),
(37, 'Student Diplomes', '/student-diplomes', '2026-03-02 11:53:58.336443', '2026-03-02 11:53:58.336443'),
(38, 'Student Contacts', '/student-contacts', '2026-03-02 11:53:58.337200', '2026-03-02 11:53:58.337200'),
(39, 'Student Link Types', '/student-link-types', '2026-03-02 11:53:58.337962', '2026-03-02 11:53:58.337962'),
(40, 'Student Notes', '/student-notes', '2026-03-02 11:53:58.338607', '2026-03-02 11:53:58.338607'),
(41, 'Settings - PDF Layout', '/settings/pdf-layout', '2026-03-02 11:54:48.084525', '2026-03-02 11:54:48.084525'),
(42, 'Roles', '/roles', '2026-03-02 11:55:31.002248', '2026-03-02 11:55:31.002248'),
(43, 'Profile', '/profile', '2026-03-02 11:55:31.005026', '2026-03-02 11:55:31.005026'),
(44, 'Student Dashboard', '/student', '2026-03-02 11:55:31.007687', '2026-03-02 11:55:31.007687'),
(45, 'Student Schedule', '/student/schedule', '2026-03-02 11:55:31.010558', '2026-03-02 11:55:31.010558'),
(46, 'Student Grades', '/student/grades', '2026-03-02 11:55:31.013703', '2026-03-02 11:55:31.013703'),
(47, 'Student Attendance', '/student/attendance', '2026-03-02 11:55:31.018564', '2026-03-02 11:55:31.018564'),
(48, 'Student Attestations', '/student/attestations', '2026-03-02 11:55:31.021991', '2026-03-02 11:55:31.021991'),
(49, 'Student Profile', '/student/profile', '2026-03-02 11:55:31.024648', '2026-03-02 11:55:31.024648'),
(50, 'Teacher Dashboard', '/teacher', '2026-03-02 11:55:31.026764', '2026-03-02 11:55:31.026764'),
(51, 'Teacher Plannings', '/teacher/plannings', '2026-03-02 11:55:31.028910', '2026-03-02 11:55:31.028910'),
(52, 'Teacher Attendance', '/teacher/attendance', '2026-03-02 11:55:31.031700', '2026-03-02 11:55:31.031700'),
(53, 'Teacher Grades', '/teacher/grades', '2026-03-02 11:55:31.034980', '2026-03-02 11:55:31.034980'),
(54, 'Teacher Links', '/teacher/links', '2026-03-02 11:55:31.038311', '2026-03-02 11:55:31.038311'),
(55, 'Teacher Profile', '/teacher/profile', '2026-03-02 11:55:31.041081', '2026-03-02 11:55:31.041081'),
(56, 'Teacher Homework', '/teacher/homework', '2026-03-02 11:55:31.044352', '2026-03-02 11:55:31.044352');

-- --------------------------------------------------------

--
-- Structure de la table `planning_session_types`
--

CREATE TABLE `planning_session_types` (
  `id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `type` varchar(50) NOT NULL,
  `coefficient` double DEFAULT NULL,
  `company_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `planning_students`
--

CREATE TABLE `planning_students` (
  `id` int(11) NOT NULL,
  `period` varchar(100) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `class_room_id` int(11) DEFAULT NULL,
  `planning_session_type_id` int(11) DEFAULT NULL,
  `date_day` date NOT NULL,
  `hour_start` time NOT NULL,
  `hour_end` time NOT NULL,
  `company_id` int(11) NOT NULL,
  `school_year_id` int(11) DEFAULT NULL,
  `class_course_id` int(11) DEFAULT NULL,
  `statut` int(11) NOT NULL DEFAULT 2,
  `is_duplicated` tinyint(4) NOT NULL DEFAULT 0,
  `duplication_source_id` int(11) DEFAULT NULL,
  `has_notes` tinyint(4) NOT NULL DEFAULT 0,
  `presence_validation_status` tinyint(4) NOT NULL DEFAULT 0,
  `notes_validation_status` tinyint(4) NOT NULL DEFAULT 0,
  `presence_validated_teacher` tinyint(4) NOT NULL DEFAULT 0,
  `presence_validated_controleur` tinyint(4) NOT NULL DEFAULT 0,
  `notes_validated_teacher` tinyint(4) NOT NULL DEFAULT 0,
  `notes_validated_controleur` tinyint(4) NOT NULL DEFAULT 0,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `programs`
--

CREATE TABLE `programs` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` longtext DEFAULT NULL,
  `pdf_file` varchar(255) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 1,
  `company_id` int(11) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `code` varchar(100) NOT NULL,
  `label` varchar(255) NOT NULL,
  `company_id` int(11) DEFAULT NULL,
  `is_system` tinyint(4) NOT NULL DEFAULT 0,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `roles`
--

INSERT INTO `roles` (`id`, `code`, `label`, `company_id`, `is_system`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'Administrator', NULL, 1, '2026-03-02 11:53:58.347527', '2026-03-02 11:53:58.347527'),
(2, 'finance', 'Finance', NULL, 1, '2026-03-02 11:53:58.350782', '2026-03-02 11:53:58.350782'),
(3, 'student', 'Student', NULL, 1, '2026-03-02 11:53:58.354187', '2026-03-02 11:53:58.354187'),
(4, 'teacher', 'Teacher', NULL, 1, '2026-03-02 11:53:58.356911', '2026-03-02 11:53:58.356911'),
(5, 'direction', 'Direction', NULL, 1, '2026-03-02 11:53:58.360570', '2026-03-02 11:53:58.360570'),
(6, 'scholarity', 'Scholarity', NULL, 1, '2026-03-02 11:53:58.363149', '2026-03-02 11:53:58.363149'),
(7, 'support', 'Support', NULL, 1, '2026-03-02 11:53:58.365627', '2026-03-02 11:53:58.365627'),
(8, 'parents', 'Parents', NULL, 1, '2026-03-02 11:53:58.368180', '2026-03-02 11:53:58.368180');

-- --------------------------------------------------------

--
-- Structure de la table `role_pages`
--

CREATE TABLE `role_pages` (
  `role_id` int(11) NOT NULL,
  `page_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `role_pages`
--

INSERT INTO `role_pages` (`role_id`, `page_id`, `company_id`, `created_at`) VALUES
(1, 4, 1, '2026-03-02 11:54:48.000000'),
(1, 5, 1, '2026-03-02 11:54:48.000000'),
(1, 6, 1, '2026-03-02 11:54:48.000000'),
(1, 7, 1, '2026-03-02 11:54:48.000000'),
(1, 8, 1, '2026-03-02 11:54:48.000000'),
(1, 9, 1, '2026-03-02 11:54:48.000000'),
(1, 41, 1, '2026-03-02 11:54:48.000000');

-- --------------------------------------------------------

--
-- Structure de la table `school_years`
--

CREATE TABLE `school_years` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `statut` int(11) NOT NULL DEFAULT 2,
  `lifecycle_status` enum('planned','ongoing','completed') NOT NULL DEFAULT 'planned',
  `company_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `school_year_periods`
--

CREATE TABLE `school_year_periods` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `statut` int(11) NOT NULL DEFAULT 2,
  `lifecycle_status` enum('planned','ongoing','completed') NOT NULL DEFAULT 'planned',
  `company_id` int(11) NOT NULL,
  `school_year_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `specializations`
--

CREATE TABLE `specializations` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `pdf_file` varchar(255) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 1,
  `company_id` int(11) NOT NULL,
  `program_id` int(11) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `birthday` date DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `email2` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `phone2` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `codePostal` varchar(255) DEFAULT NULL,
  `nationality` varchar(255) DEFAULT NULL,
  `picture` varchar(255) DEFAULT NULL,
  `statut` int(11) DEFAULT 1,
  `company_id` int(11) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `student_attestations`
--

CREATE TABLE `student_attestations` (
  `id` int(11) NOT NULL,
  `Idstudent` int(11) NOT NULL,
  `Idattestation` int(11) NOT NULL,
  `dateask` date DEFAULT NULL,
  `datedelivery` date DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `Status` int(11) DEFAULT 1,
  `companyid` int(11) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `student_contacts`
--

CREATE TABLE `student_contacts` (
  `id` int(11) NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `birthday` date DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `adress` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `codePostal` varchar(255) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `studentlinktypeId` int(11) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `statut` int(11) DEFAULT 1,
  `company_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `student_diplomes`
--

CREATE TABLE `student_diplomes` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `school` varchar(255) NOT NULL,
  `diplome` varchar(255) DEFAULT NULL,
  `annee` int(11) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `diplome_picture_1` varchar(255) DEFAULT NULL,
  `diplome_picture_2` varchar(255) DEFAULT NULL,
  `student_id` int(11) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `statut` int(11) DEFAULT 1,
  `company_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `student_link_types`
--

CREATE TABLE `student_link_types` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `link` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `statut` int(11) DEFAULT 1,
  `company_id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `student_payments`
--

CREATE TABLE `student_payments` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `school_year_id` int(11) NOT NULL,
  `level_id` int(11) NOT NULL,
  `level_pricing_id` int(11) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment` decimal(12,2) NOT NULL,
  `date` date NOT NULL,
  `mode` varchar(50) NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `company_id` int(11) NOT NULL,
  `statut` int(11) NOT NULL DEFAULT 2,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `student_presence`
--

CREATE TABLE `student_presence` (
  `id` int(11) NOT NULL,
  `student_planning_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `presence` varchar(25) NOT NULL DEFAULT 'absent',
  `note` double NOT NULL DEFAULT -1,
  `remarks` longtext DEFAULT NULL,
  `company_id` int(11) NOT NULL,
  `report_id` int(11) DEFAULT NULL,
  `validate_report` tinyint(4) NOT NULL DEFAULT 0,
  `locked` tinyint(4) NOT NULL DEFAULT 0,
  `statut` int(11) NOT NULL DEFAULT 2,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `student_reports`
--

CREATE TABLE `student_reports` (
  `id` int(11) NOT NULL,
  `school_year_period_id` int(11) NOT NULL,
  `school_year_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `remarks` longtext DEFAULT NULL,
  `mention` varchar(100) DEFAULT NULL,
  `passed` tinyint(4) NOT NULL DEFAULT 0,
  `statut` int(11) NOT NULL DEFAULT 2,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `student_report_details`
--

CREATE TABLE `student_report_details` (
  `id` int(11) NOT NULL,
  `student_report_id` int(11) NOT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `course_id` int(11) DEFAULT NULL,
  `remarks` longtext DEFAULT NULL,
  `note` int(11) DEFAULT NULL,
  `statut` int(11) NOT NULL DEFAULT 2,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `teachers`
--

CREATE TABLE `teachers` (
  `id` int(11) NOT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `birthday` date DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `email2` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `phone2` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `codePostal` varchar(255) NOT NULL,
  `nationality` varchar(255) DEFAULT NULL,
  `picture` varchar(255) DEFAULT NULL,
  `statut` int(11) DEFAULT 2,
  `company_id` int(11) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `teacher_course`
--

CREATE TABLE `teacher_course` (
  `teacher_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `picture` varchar(255) DEFAULT NULL,
  `privacy_policy_accepted` tinyint(4) NOT NULL DEFAULT 0,
  `terms_accepted` tinyint(4) NOT NULL DEFAULT 0,
  `consent_accepted_at` datetime DEFAULT NULL,
  `company_id` int(11) NOT NULL,
  `statut` int(11) DEFAULT 1,
  `password_set_token` varchar(255) DEFAULT NULL,
  `password_set_token_expires_at` datetime DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `email`, `phone`, `picture`, `privacy_policy_accepted`, `terms_accepted`, `consent_accepted_at`, `company_id`, `statut`, `password_set_token`, `password_set_token_expires_at`, `created_at`, `updated_at`) VALUES
(1, 'admin_test', '$2b$10$ON8X9hQuykQR0djrv.XlDe0hWbHG1xE6cdEdnELfs7OJ/t.33W7EC', 'walidbirori@gmail.com', '+212655996022', NULL, 1, 1, '2026-03-02 11:54:48', 1, 1, NULL, NULL, '2026-03-02 11:54:48.229104', '2026-03-02 11:55:19.000000'),
(2, 'walid_agourd', NULL, 'walidagourd@gmail.com', '+212655996022', '/uploads/1/users/1772463569656_pngtree-user-profile-avatar-png-image_10211467.png', 0, 0, NULL, 1, 2, '$2b$10$2LWq5tb5/EnN6rHkCcJgm.MYvL/bqqT1OjxR/60XrfMXzpwTWpJbu', '2026-03-03 13:41:47', '2026-03-02 13:41:47.483519', '2026-03-02 14:59:29.000000'),
(3, 'sisko001', NULL, 'oualidagourd@gmail.com', '+212655996022', '/uploads/1/users/1772464927150_pngtree-user-profile-avatar-png-image_10211467.png', 0, 0, NULL, 1, 2, '$2b$10$VSUn5CaaibVkouprLF9T5enASeV4372E91X35h8UuOUUdUPNq29JO', '2026-03-03 15:22:07', '2026-03-02 15:22:07.304962', '2026-03-02 15:22:07.304962');

-- --------------------------------------------------------

--
-- Structure de la table `user_roles`
--

CREATE TABLE `user_roles` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `user_roles`
--

INSERT INTO `user_roles` (`user_id`, `role_id`, `company_id`) VALUES
(1, 1, 1),
(2, 2, 1),
(2, 5, 1);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `administrators`
--
ALTER TABLE `administrators`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `IDX_4ee5216a00cb99b2dede98509c` (`email`),
  ADD KEY `FK_c811b22246e7324f4a8d801d033` (`company_id`),
  ADD KEY `FK_357ee5dce7fcba7273ee816f105` (`class_room_id`);

--
-- Index pour la table `attestations`
--
ALTER TABLE `attestations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_4f5e7d3fc1d7292ae3e6bfc3430` (`companyid`);

--
-- Index pour la table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_6c42a805f572752a64333a6fbf2` (`company_id`),
  ADD KEY `FK_803518cdd2ea612eb81a784bb51` (`program_id`),
  ADD KEY `FK_cd04463c9100a149f4a72eb2c8a` (`specialization_id`),
  ADD KEY `FK_b8ebce40315e1d2d5d985873c5f` (`level_id`),
  ADD KEY `FK_6e9f9fea48df76145aedc17807b` (`school_year_id`);

--
-- Index pour la table `classroom_types`
--
ALTER TABLE `classroom_types`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_9e4fdb7a79dacc965eeccb3c20c` (`company_id`);

--
-- Index pour la table `class_courses`
--
ALTER TABLE `class_courses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_1cb14257cde585a3acfed6dcc83` (`company_id`),
  ADD KEY `FK_5e6c3c020c1138eadf3830a6809` (`level_id`),
  ADD KEY `FK_a6445f75e63d14f079c46e438b7` (`module_id`),
  ADD KEY `FK_794c5f3538b65ab5c6aa6622c3c` (`course_id`);

--
-- Index pour la table `class_rooms`
--
ALTER TABLE `class_rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `IDX_c235b9ec000f26af6790b5c9ec` (`code`),
  ADD KEY `FK_bc2d7b82ec6178ce198076d4e1f` (`company_id`),
  ADD KEY `FK_cf1de16ede842de332ba66149a9` (`classroom_type_id`);

--
-- Index pour la table `class_students`
--
ALTER TABLE `class_students`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_292594e8b27d35c284d338005f7` (`company_id`),
  ADD KEY `FK_43e081daadb906f3dc41bb267dd` (`class_id`),
  ADD KEY `FK_6d12f65ab61f9f92e3d7e95ad23` (`student_id`);

--
-- Index pour la table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `IDX_d0af6f5866201d5cb424767744` (`email`);

--
-- Index pour la table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_fcb4308df0fe59417815b1ea021` (`company_id`);

--
-- Index pour la table `levels`
--
ALTER TABLE `levels`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_6b00e7a6b28367129e0f7104319` (`company_id`),
  ADD KEY `FK_061e321b375fb29ebfee345ee86` (`specialization_id`);

--
-- Index pour la table `level_pricings`
--
ALTER TABLE `level_pricings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_7992ca3e43dd92933b7fbd35772` (`level_id`),
  ADD KEY `FK_672bbbc99f159df4a017df1a33c` (`company_id`);

--
-- Index pour la table `modules`
--
ALTER TABLE `modules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_b3b19b9ac6a4beaaa7d254f74e9` (`company_id`);

--
-- Index pour la table `module_course`
--
ALTER TABLE `module_course`
  ADD PRIMARY KEY (`module_id`,`course_id`),
  ADD KEY `IDX_af6cbf81fd55731da29a2b8f87` (`module_id`),
  ADD KEY `IDX_743ec2e67a0baf130e8803d4d8` (`course_id`);

--
-- Index pour la table `pages`
--
ALTER TABLE `pages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `IDX_8a1378556842ea4608f5be76e5` (`route`);

--
-- Index pour la table `planning_session_types`
--
ALTER TABLE `planning_session_types`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_a4339483b36a523227b3b18bc27` (`company_id`);

--
-- Index pour la table `planning_students`
--
ALTER TABLE `planning_students`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_5531ff05504bdc1cb5e45fd0ca2` (`teacher_id`),
  ADD KEY `FK_bbbe6dd51b0fbfa2064d4d79876` (`course_id`),
  ADD KEY `FK_21a576f80a312994d659b399640` (`class_id`),
  ADD KEY `FK_c8319e185ac9101aa68ce542173` (`company_id`),
  ADD KEY `FK_dab87723154a49f5c819bfda920` (`class_room_id`),
  ADD KEY `FK_318a77de4e816d9a06e2350a07f` (`planning_session_type_id`),
  ADD KEY `FK_76c2d6e81d9ac2319db0dc9c573` (`school_year_id`),
  ADD KEY `FK_c891452aca76f45a1a98663fa1d` (`class_course_id`);

--
-- Index pour la table `programs`
--
ALTER TABLE `programs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_6c5da6ed118608e99bfade9e7f6` (`company_id`);

--
-- Index pour la table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `IDX_5fd8686105fdc13330fb047d20` (`code`,`company_id`),
  ADD KEY `FK_4bc1204a05dde26383e3955b0a1` (`company_id`);

--
-- Index pour la table `role_pages`
--
ALTER TABLE `role_pages`
  ADD PRIMARY KEY (`role_id`,`page_id`,`company_id`),
  ADD KEY `FK_763a33d0f12ad09a5a75fc78db5` (`page_id`);

--
-- Index pour la table `school_years`
--
ALTER TABLE `school_years`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_e03cc3580d8676387890b6ed946` (`company_id`);

--
-- Index pour la table `school_year_periods`
--
ALTER TABLE `school_year_periods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_b11933f6ae89e72492d3a5ed31a` (`company_id`),
  ADD KEY `FK_4a5e1b91f0a965e2e963647e8eb` (`school_year_id`);

--
-- Index pour la table `specializations`
--
ALTER TABLE `specializations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_f34f80e33d0092bb3ee5607977a` (`program_id`),
  ADD KEY `FK_9748670dff2a87905fd8a80c48d` (`company_id`);

--
-- Index pour la table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `IDX_25985d58c714a4a427ced57507` (`email`),
  ADD KEY `FK_27e62bb071fdd6c06508bf36062` (`company_id`);

--
-- Index pour la table `student_attestations`
--
ALTER TABLE `student_attestations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_81535973e471578d289fdea8c47` (`Idstudent`),
  ADD KEY `FK_66dfa23c80e761a33ef74ba7061` (`Idattestation`),
  ADD KEY `FK_72ea33fc411cf19c4790cfdf7ae` (`companyid`);

--
-- Index pour la table `student_contacts`
--
ALTER TABLE `student_contacts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_a1774a46522d55db001e6288176` (`company_id`),
  ADD KEY `FK_0c3cdd27069e42ad422cbcd28dc` (`student_id`),
  ADD KEY `FK_6020ad0b850b63960bb917d27a3` (`studentlinktypeId`);

--
-- Index pour la table `student_diplomes`
--
ALTER TABLE `student_diplomes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_e6b649dd760e4ad8c278bfc94a5` (`student_id`),
  ADD KEY `FK_6028d81f0375f1edb3686c78156` (`company_id`);

--
-- Index pour la table `student_link_types`
--
ALTER TABLE `student_link_types`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_e849bae0eab6e50d692e116c22e` (`company_id`),
  ADD KEY `FK_fd32781c44a637c8cf425c851a0` (`student_id`);

--
-- Index pour la table `student_payments`
--
ALTER TABLE `student_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_cd2717d3f280d32022aaf7eb3be` (`student_id`),
  ADD KEY `FK_b067b1803aef742966ef325b9e4` (`school_year_id`),
  ADD KEY `FK_8504b31aad535b2404817bd3c18` (`level_id`),
  ADD KEY `FK_7c1401e8e8901de247f7b012bdd` (`company_id`),
  ADD KEY `FK_f776440929d96f4a5351c928701` (`level_pricing_id`);

--
-- Index pour la table `student_presence`
--
ALTER TABLE `student_presence`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UQ_student_presence_student_planning` (`student_id`,`student_planning_id`),
  ADD KEY `FK_557462e90ac6cfd79dc9e884315` (`student_planning_id`),
  ADD KEY `FK_d262e2b085dd61f98599fec5a55` (`company_id`),
  ADD KEY `FK_4c3e024c7de67d06ad280fe8fbe` (`report_id`);

--
-- Index pour la table `student_reports`
--
ALTER TABLE `student_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_e5465034f49d24f081ba8c44c7e` (`school_year_period_id`),
  ADD KEY `FK_2b2606bde221cb594b288cdd2bf` (`school_year_id`),
  ADD KEY `FK_2b5d308b8a2f0f7b273c443d73f` (`company_id`),
  ADD KEY `FK_aa1bc7e2fd5382f8fe80cd83d61` (`student_id`);

--
-- Index pour la table `student_report_details`
--
ALTER TABLE `student_report_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_d7537dcbb4d80a1772b66ad65b5` (`student_report_id`),
  ADD KEY `FK_96b390a650d1857ae6f76988eb0` (`teacher_id`),
  ADD KEY `FK_683fd0cc383ac04d9061492934d` (`course_id`);

--
-- Index pour la table `teachers`
--
ALTER TABLE `teachers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `IDX_7568c49a630907119e4a665c60` (`email`),
  ADD KEY `FK_b40f5aa7da92e4e233bf640ce77` (`company_id`);

--
-- Index pour la table `teacher_course`
--
ALTER TABLE `teacher_course`
  ADD PRIMARY KEY (`teacher_id`,`course_id`),
  ADD KEY `FK_333d3cf5bab7cae8a333c6bb6dd` (`course_id`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `IDX_fe0bb3f6520ee0469504521e71` (`username`),
  ADD UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`),
  ADD KEY `FK_7ae6334059289559722437bcc1c` (`company_id`);

--
-- Index pour la table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`user_id`,`role_id`),
  ADD KEY `FK_b23c65e50a758245a33ee35fda1` (`role_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `administrators`
--
ALTER TABLE `administrators`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `attestations`
--
ALTER TABLE `attestations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `classes`
--
ALTER TABLE `classes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `classroom_types`
--
ALTER TABLE `classroom_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `class_courses`
--
ALTER TABLE `class_courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `class_rooms`
--
ALTER TABLE `class_rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `class_students`
--
ALTER TABLE `class_students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `levels`
--
ALTER TABLE `levels`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `level_pricings`
--
ALTER TABLE `level_pricings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `modules`
--
ALTER TABLE `modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `pages`
--
ALTER TABLE `pages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT pour la table `planning_session_types`
--
ALTER TABLE `planning_session_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `planning_students`
--
ALTER TABLE `planning_students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `programs`
--
ALTER TABLE `programs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `school_years`
--
ALTER TABLE `school_years`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `school_year_periods`
--
ALTER TABLE `school_year_periods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `specializations`
--
ALTER TABLE `specializations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `student_attestations`
--
ALTER TABLE `student_attestations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `student_contacts`
--
ALTER TABLE `student_contacts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `student_diplomes`
--
ALTER TABLE `student_diplomes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `student_link_types`
--
ALTER TABLE `student_link_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `student_payments`
--
ALTER TABLE `student_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `student_presence`
--
ALTER TABLE `student_presence`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `student_reports`
--
ALTER TABLE `student_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `student_report_details`
--
ALTER TABLE `student_report_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `teachers`
--
ALTER TABLE `teachers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `administrators`
--
ALTER TABLE `administrators`
  ADD CONSTRAINT `FK_357ee5dce7fcba7273ee816f105` FOREIGN KEY (`class_room_id`) REFERENCES `class_rooms` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_c811b22246e7324f4a8d801d033` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `attestations`
--
ALTER TABLE `attestations`
  ADD CONSTRAINT `FK_4f5e7d3fc1d7292ae3e6bfc3430` FOREIGN KEY (`companyid`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `classes`
--
ALTER TABLE `classes`
  ADD CONSTRAINT `FK_6c42a805f572752a64333a6fbf2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_6e9f9fea48df76145aedc17807b` FOREIGN KEY (`school_year_id`) REFERENCES `school_years` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_803518cdd2ea612eb81a784bb51` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_b8ebce40315e1d2d5d985873c5f` FOREIGN KEY (`level_id`) REFERENCES `levels` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_cd04463c9100a149f4a72eb2c8a` FOREIGN KEY (`specialization_id`) REFERENCES `specializations` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `classroom_types`
--
ALTER TABLE `classroom_types`
  ADD CONSTRAINT `FK_9e4fdb7a79dacc965eeccb3c20c` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `class_courses`
--
ALTER TABLE `class_courses`
  ADD CONSTRAINT `FK_1cb14257cde585a3acfed6dcc83` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_5e6c3c020c1138eadf3830a6809` FOREIGN KEY (`level_id`) REFERENCES `levels` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_794c5f3538b65ab5c6aa6622c3c` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_a6445f75e63d14f079c46e438b7` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `class_rooms`
--
ALTER TABLE `class_rooms`
  ADD CONSTRAINT `FK_bc2d7b82ec6178ce198076d4e1f` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_cf1de16ede842de332ba66149a9` FOREIGN KEY (`classroom_type_id`) REFERENCES `classroom_types` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Contraintes pour la table `class_students`
--
ALTER TABLE `class_students`
  ADD CONSTRAINT `FK_292594e8b27d35c284d338005f7` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_43e081daadb906f3dc41bb267dd` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_6d12f65ab61f9f92e3d7e95ad23` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `courses`
--
ALTER TABLE `courses`
  ADD CONSTRAINT `FK_fcb4308df0fe59417815b1ea021` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `levels`
--
ALTER TABLE `levels`
  ADD CONSTRAINT `FK_061e321b375fb29ebfee345ee86` FOREIGN KEY (`specialization_id`) REFERENCES `specializations` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_6b00e7a6b28367129e0f7104319` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `level_pricings`
--
ALTER TABLE `level_pricings`
  ADD CONSTRAINT `FK_672bbbc99f159df4a017df1a33c` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_7992ca3e43dd92933b7fbd35772` FOREIGN KEY (`level_id`) REFERENCES `levels` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `modules`
--
ALTER TABLE `modules`
  ADD CONSTRAINT `FK_b3b19b9ac6a4beaaa7d254f74e9` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `module_course`
--
ALTER TABLE `module_course`
  ADD CONSTRAINT `FK_743ec2e67a0baf130e8803d4d85` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_af6cbf81fd55731da29a2b8f874` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `planning_session_types`
--
ALTER TABLE `planning_session_types`
  ADD CONSTRAINT `FK_a4339483b36a523227b3b18bc27` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `planning_students`
--
ALTER TABLE `planning_students`
  ADD CONSTRAINT `FK_21a576f80a312994d659b399640` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_318a77de4e816d9a06e2350a07f` FOREIGN KEY (`planning_session_type_id`) REFERENCES `planning_session_types` (`id`) ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_5531ff05504bdc1cb5e45fd0ca2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_76c2d6e81d9ac2319db0dc9c573` FOREIGN KEY (`school_year_id`) REFERENCES `school_years` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_bbbe6dd51b0fbfa2064d4d79876` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_c8319e185ac9101aa68ce542173` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_c891452aca76f45a1a98663fa1d` FOREIGN KEY (`class_course_id`) REFERENCES `class_courses` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_dab87723154a49f5c819bfda920` FOREIGN KEY (`class_room_id`) REFERENCES `class_rooms` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `programs`
--
ALTER TABLE `programs`
  ADD CONSTRAINT `FK_6c5da6ed118608e99bfade9e7f6` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `roles`
--
ALTER TABLE `roles`
  ADD CONSTRAINT `FK_4bc1204a05dde26383e3955b0a1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `role_pages`
--
ALTER TABLE `role_pages`
  ADD CONSTRAINT `FK_763a33d0f12ad09a5a75fc78db5` FOREIGN KEY (`page_id`) REFERENCES `pages` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_fc7b16bb146c798654131f350a4` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `school_years`
--
ALTER TABLE `school_years`
  ADD CONSTRAINT `FK_e03cc3580d8676387890b6ed946` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `school_year_periods`
--
ALTER TABLE `school_year_periods`
  ADD CONSTRAINT `FK_4a5e1b91f0a965e2e963647e8eb` FOREIGN KEY (`school_year_id`) REFERENCES `school_years` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_b11933f6ae89e72492d3a5ed31a` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `specializations`
--
ALTER TABLE `specializations`
  ADD CONSTRAINT `FK_9748670dff2a87905fd8a80c48d` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_f34f80e33d0092bb3ee5607977a` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `FK_27e62bb071fdd6c06508bf36062` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `student_attestations`
--
ALTER TABLE `student_attestations`
  ADD CONSTRAINT `FK_66dfa23c80e761a33ef74ba7061` FOREIGN KEY (`Idattestation`) REFERENCES `attestations` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_72ea33fc411cf19c4790cfdf7ae` FOREIGN KEY (`companyid`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_81535973e471578d289fdea8c47` FOREIGN KEY (`Idstudent`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `student_contacts`
--
ALTER TABLE `student_contacts`
  ADD CONSTRAINT `FK_0c3cdd27069e42ad422cbcd28dc` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_6020ad0b850b63960bb917d27a3` FOREIGN KEY (`studentlinktypeId`) REFERENCES `student_link_types` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_a1774a46522d55db001e6288176` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `student_diplomes`
--
ALTER TABLE `student_diplomes`
  ADD CONSTRAINT `FK_6028d81f0375f1edb3686c78156` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_e6b649dd760e4ad8c278bfc94a5` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Contraintes pour la table `student_link_types`
--
ALTER TABLE `student_link_types`
  ADD CONSTRAINT `FK_e849bae0eab6e50d692e116c22e` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_fd32781c44a637c8cf425c851a0` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Contraintes pour la table `student_payments`
--
ALTER TABLE `student_payments`
  ADD CONSTRAINT `FK_7c1401e8e8901de247f7b012bdd` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_8504b31aad535b2404817bd3c18` FOREIGN KEY (`level_id`) REFERENCES `levels` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_b067b1803aef742966ef325b9e4` FOREIGN KEY (`school_year_id`) REFERENCES `school_years` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_cd2717d3f280d32022aaf7eb3be` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_f776440929d96f4a5351c928701` FOREIGN KEY (`level_pricing_id`) REFERENCES `level_pricings` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

--
-- Contraintes pour la table `student_presence`
--
ALTER TABLE `student_presence`
  ADD CONSTRAINT `FK_32b1f364dd6670b6ebaa345c60f` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_4c3e024c7de67d06ad280fe8fbe` FOREIGN KEY (`report_id`) REFERENCES `student_reports` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_557462e90ac6cfd79dc9e884315` FOREIGN KEY (`student_planning_id`) REFERENCES `planning_students` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_d262e2b085dd61f98599fec5a55` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `student_reports`
--
ALTER TABLE `student_reports`
  ADD CONSTRAINT `FK_2b2606bde221cb594b288cdd2bf` FOREIGN KEY (`school_year_id`) REFERENCES `school_years` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_2b5d308b8a2f0f7b273c443d73f` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_aa1bc7e2fd5382f8fe80cd83d61` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_e5465034f49d24f081ba8c44c7e` FOREIGN KEY (`school_year_period_id`) REFERENCES `school_year_periods` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `student_report_details`
--
ALTER TABLE `student_report_details`
  ADD CONSTRAINT `FK_683fd0cc383ac04d9061492934d` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_96b390a650d1857ae6f76988eb0` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_d7537dcbb4d80a1772b66ad65b5` FOREIGN KEY (`student_report_id`) REFERENCES `student_reports` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `teachers`
--
ALTER TABLE `teachers`
  ADD CONSTRAINT `FK_b40f5aa7da92e4e233bf640ce77` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `teacher_course`
--
ALTER TABLE `teacher_course`
  ADD CONSTRAINT `FK_333d3cf5bab7cae8a333c6bb6dd` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_5e7f3715c2077476871abb8735c` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `FK_7ae6334059289559722437bcc1c` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Contraintes pour la table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `FK_87b8888186ca9769c960e926870` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_b23c65e50a758245a33ee35fda1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
