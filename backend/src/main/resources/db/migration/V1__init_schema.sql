--
-- PostgreSQL database dump
--


-- Dumped from database version 15.19
-- Dumped by pg_dump version 15.19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: advertisements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.advertisements (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    description text,
    display_order integer DEFAULT 0 NOT NULL,
    image_url character varying(1000) NOT NULL,
    is_active boolean NOT NULL,
    name character varying(255) NOT NULL,
    "position" character varying(255) NOT NULL,
    target_url character varying(1000),
    CONSTRAINT advertisements_position_check CHECK ((("position")::text = ANY ((ARRAY['LEFT'::character varying, 'RIGHT'::character varying])::text[])))
);


--
-- Name: advertisements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.advertisements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: advertisements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.advertisements_id_seq OWNED BY public.advertisements.id;


--
-- Name: ai_insights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_insights (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    content text NOT NULL,
    insight_type character varying(30) NOT NULL,
    metrics_snapshot text,
    period_end date NOT NULL,
    period_start date NOT NULL,
    suggested_events_json text,
    CONSTRAINT ai_insights_insight_type_check CHECK (((insight_type)::text = ANY ((ARRAY['WEEKLY_TREND'::character varying, 'MONTHLY_TREND'::character varying])::text[])))
);


--
-- Name: ai_insights_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_insights_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_insights_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_insights_id_seq OWNED BY public.ai_insights.id;


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    deposit numeric(38,2) DEFAULT 0 NOT NULL,
    rental_days integer,
    rental_end_date date,
    rental_fee numeric(38,2) DEFAULT 0 NOT NULL,
    rental_start_date date,
    subtotal numeric(38,2) NOT NULL,
    unit_price numeric(38,2) NOT NULL,
    cart_id bigint NOT NULL,
    costume_item_id bigint NOT NULL
);


--
-- Name: cart_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cart_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cart_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cart_items_id_seq OWNED BY public.cart_items.id;


--
-- Name: carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carts (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    status character varying(255) NOT NULL,
    total_deposit numeric(38,2) DEFAULT 0 NOT NULL,
    total_rental_fee numeric(38,2) DEFAULT 0 NOT NULL,
    total_value numeric(38,2) NOT NULL,
    user_id bigint NOT NULL,
    CONSTRAINT carts_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'CHECKED_OUT'::character varying, 'ABANDONED'::character varying])::text[])))
);


--
-- Name: carts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.carts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: carts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.carts_id_seq OWNED BY public.carts.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    name character varying(100) NOT NULL,
    path character varying(500) DEFAULT ''::character varying NOT NULL,
    slug character varying(120) DEFAULT ''::character varying NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    parent_id bigint
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    content text NOT NULL,
    intent_json text,
    recommended_costume_ids text,
    role character varying(20) NOT NULL,
    chat_session_id bigint NOT NULL,
    CONSTRAINT chat_messages_role_check CHECK (((role)::text = ANY ((ARRAY['USER'::character varying, 'ASSISTANT'::character varying])::text[])))
);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: chat_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_sessions (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    session_id character varying(36) NOT NULL,
    status character varying(20) NOT NULL,
    user_id bigint,
    CONSTRAINT chat_sessions_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'CLOSED'::character varying])::text[])))
);


--
-- Name: chat_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chat_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_sessions_id_seq OWNED BY public.chat_sessions.id;


--
-- Name: clubs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clubs (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    description character varying(255),
    discount_rate double precision NOT NULL,
    membership_fee numeric(38,2) NOT NULL,
    name character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    CONSTRAINT clubs_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying])::text[])))
);


--
-- Name: clubs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clubs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clubs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clubs_id_seq OWNED BY public.clubs.id;


--
-- Name: costume_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.costume_images (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    display_order integer NOT NULL,
    image_url text NOT NULL,
    is_primary boolean NOT NULL,
    costume_id bigint NOT NULL
);


--
-- Name: costume_images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.costume_images_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: costume_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.costume_images_id_seq OWNED BY public.costume_images.id;


--
-- Name: costume_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.costume_items (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    color character varying(255) NOT NULL,
    size character varying(255) NOT NULL,
    sku character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    costume_id bigint NOT NULL,
    version bigint,
    CONSTRAINT costume_items_status_check CHECK (((status)::text = ANY ((ARRAY['AVAILABLE'::character varying, 'RESERVED'::character varying, 'RENTED'::character varying, 'MAINTENANCE'::character varying, 'LOST'::character varying, 'RETURNING'::character varying])::text[])))
);


--
-- Name: costume_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.costume_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: costume_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.costume_items_id_seq OWNED BY public.costume_items.id;


--
-- Name: costume_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.costume_metadata (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    body_type character varying(255),
    color character varying(255) NOT NULL,
    fit_note text,
    gender_label character varying(255),
    material character varying(255),
    occasion character varying(255) NOT NULL,
    season character varying(255) NOT NULL,
    size_label character varying(255),
    skin_tone character varying(255),
    style character varying(255) NOT NULL,
    costume_id bigint NOT NULL
);


--
-- Name: costume_metadata_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.costume_metadata_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: costume_metadata_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.costume_metadata_id_seq OWNED BY public.costume_metadata.id;


--
-- Name: costume_metadata_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.costume_metadata_tags (
    costume_metadata_id bigint NOT NULL,
    tag character varying(255) NOT NULL
);


--
-- Name: costumes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.costumes (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    deposit_price numeric(38,2) NOT NULL,
    description text,
    image_url_legacy character varying(255),
    name character varying(255) NOT NULL,
    rental_price numeric(38,2) NOT NULL,
    slug character varying(200),
    status character varying(255) NOT NULL,
    category_id bigint NOT NULL,
    CONSTRAINT costumes_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying, 'DISCONTINUED'::character varying])::text[])))
);


--
-- Name: costumes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.costumes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: costumes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.costumes_id_seq OWNED BY public.costumes.id;


--
-- Name: event_costumes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_costumes (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    discount_percent_override numeric(5,2),
    costume_id bigint NOT NULL,
    event_id bigint NOT NULL
);


--
-- Name: event_costumes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.event_costumes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: event_costumes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.event_costumes_id_seq OWNED BY public.event_costumes.id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    banner_image_url character varying(500),
    description text,
    discount_percent numeric(5,2) NOT NULL,
    end_date timestamp(6) without time zone NOT NULL,
    name character varying(200) NOT NULL,
    side_banner_image_url character varying(500),
    slug character varying(220),
    start_date timestamp(6) without time zone NOT NULL,
    status character varying(20) NOT NULL,
    CONSTRAINT events_status_check CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'ACTIVE'::character varying, 'ENDED'::character varying, 'CANCELLED'::character varying])::text[])))
);


--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- Name: handover_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.handover_records (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    handover_type character varying(255) NOT NULL,
    image_url text,
    note text,
    return_status character varying(255) NOT NULL,
    rental_order_detail_id bigint NOT NULL,
    staff_user_id bigint NOT NULL,
    CONSTRAINT handover_records_handover_type_check CHECK (((handover_type)::text = ANY ((ARRAY['PICKUP'::character varying, 'RETURN'::character varying])::text[]))),
    CONSTRAINT handover_records_return_status_check CHECK (((return_status)::text = ANY ((ARRAY['NOT_RETURNED'::character varying, 'RETURNED'::character varying, 'DAMAGED'::character varying, 'LOST'::character varying])::text[])))
);


--
-- Name: handover_records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.handover_records_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: handover_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.handover_records_id_seq OWNED BY public.handover_records.id;


--
-- Name: otp_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otp_verifications (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    email character varying(150) NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    full_name character varying(150),
    otp_code character varying(6) NOT NULL,
    password_hash character varying(255),
    phone character varying(20)
);


--
-- Name: otp_verifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.otp_verifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: otp_verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.otp_verifications_id_seq OWNED BY public.otp_verifications.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    amount numeric(38,2) NOT NULL,
    method character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    transaction_id character varying(255),
    type character varying(255) NOT NULL,
    rental_order_id bigint NOT NULL,
    CONSTRAINT payments_method_check CHECK (((method)::text = ANY ((ARRAY['CASH'::character varying, 'BANKING'::character varying, 'MOMO'::character varying, 'VN_PAY'::character varying])::text[]))),
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'PAID'::character varying, 'FAILED'::character varying, 'REFUNDED'::character varying])::text[]))),
    CONSTRAINT payments_type_check CHECK (((type)::text = ANY ((ARRAY['PAYMENT'::character varying, 'REFUND'::character varying])::text[])))
);


--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: product_ai_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_ai_metadata (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    admin_notes text,
    budget_tier character varying(255),
    color_tags_json jsonb,
    costume_id bigint NOT NULL,
    created_by_email character varying(255),
    fit_tags_json jsonb,
    formality_level character varying(255),
    gender_tags_json jsonb,
    material_tags_json jsonb,
    occasion_tags_json jsonb,
    searchable_text text,
    season_tags_json jsonb,
    silhouette character varying(255),
    size_tags_json jsonb,
    style_tags_json jsonb,
    trend_tags_json jsonb,
    updated_by_email character varying(255)
);


--
-- Name: product_ai_metadata_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_ai_metadata_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_ai_metadata_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_ai_metadata_id_seq OWNED BY public.product_ai_metadata.id;


--
-- Name: product_embeddings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_embeddings (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    costume_id bigint NOT NULL,
    embedding_dimension integer NOT NULL,
    embedding_model character varying(255) NOT NULL,
    embedding_payload text NOT NULL,
    last_error text,
    source_type character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    text_hash character varying(255),
    text_snapshot text,
    CONSTRAINT product_embeddings_source_type_check CHECK (((source_type)::text = ANY ((ARRAY['PRODUCT_METADATA'::character varying, 'RECOMMENDATION_QUERY'::character varying])::text[]))),
    CONSTRAINT product_embeddings_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'READY'::character varying, 'FAILED'::character varying])::text[])))
);


--
-- Name: product_embeddings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_embeddings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_embeddings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_embeddings_id_seq OWNED BY public.product_embeddings.id;


--
-- Name: promotions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promotions (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    code character varying(50) NOT NULL,
    discount_percent integer NOT NULL,
    expiry_date timestamp(6) without time zone NOT NULL,
    max_discount numeric(38,2) NOT NULL,
    status character varying(255) NOT NULL,
    user_id bigint NOT NULL,
    CONSTRAINT promotions_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'USED'::character varying, 'EXPIRED'::character varying])::text[])))
);


--
-- Name: promotions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.promotions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: promotions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.promotions_id_seq OWNED BY public.promotions.id;


--
-- Name: rental_order_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rental_order_details (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    damage_fee numeric(38,2),
    deposit numeric(38,2) NOT NULL,
    discount_event_id bigint,
    discount_event_name character varying(255),
    discount_percent numeric(5,2),
    late_fee numeric(38,2),
    price numeric(38,2) NOT NULL,
    price_per_day numeric(38,2) NOT NULL,
    refunded_amount numeric(38,2),
    rental_days integer NOT NULL,
    rental_end_date date,
    rental_start_date date,
    return_status character varying(255) NOT NULL,
    subtotal numeric(38,2) NOT NULL,
    costume_item_id bigint NOT NULL,
    rental_order_id bigint NOT NULL,
    CONSTRAINT rental_order_details_return_status_check CHECK (((return_status)::text = ANY ((ARRAY['NOT_RETURNED'::character varying, 'RETURNED'::character varying, 'DAMAGED'::character varying, 'LOST'::character varying])::text[])))
);


--
-- Name: rental_order_details_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rental_order_details_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rental_order_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rental_order_details_id_seq OWNED BY public.rental_order_details.id;


--
-- Name: rental_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rental_orders (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    cancel_reason text,
    delivery_address text NOT NULL,
    delivery_method character varying(255),
    discount_amount numeric(38,2) NOT NULL,
    district_id integer,
    extension_fee numeric(38,2),
    ghn_order_code character varying(255),
    ghn_return_order_code character varying(255),
    inspection_note text,
    receiver_name character varying(255) NOT NULL,
    receiver_phone character varying(255) NOT NULL,
    rental_end_date date,
    rental_start_date date,
    session_id character varying(36),
    shipping_fee numeric(38,2) NOT NULL,
    status character varying(255) NOT NULL,
    total_damage_fee numeric(38,2),
    total_deposit numeric(38,2) NOT NULL,
    total_late_fee numeric(38,2),
    total_price numeric(38,2) NOT NULL,
    total_refunded_amount numeric(38,2),
    total_rental_price numeric(38,2) NOT NULL,
    ward_code character varying(255),
    user_id bigint NOT NULL,
    CONSTRAINT rental_orders_delivery_method_check CHECK (((delivery_method)::text = ANY ((ARRAY['STORE_PICKUP'::character varying, 'GHN_DELIVERY'::character varying])::text[]))),
    CONSTRAINT rental_orders_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'CONFIRMED'::character varying, 'CANCELLED'::character varying, 'PICKED_UP'::character varying, 'RETURNED'::character varying, 'COMPLETED'::character varying, 'SHIPPING'::character varying, 'RENTED'::character varying, 'RETURNING'::character varying, 'PENDING_REFUND'::character varying])::text[])))
);


--
-- Name: rental_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rental_orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rental_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rental_orders_id_seq OWNED BY public.rental_orders.id;


--
-- Name: review_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_images (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    display_order integer NOT NULL,
    review_id bigint NOT NULL,
    upload_asset_id bigint NOT NULL
);


--
-- Name: review_images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_images_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: review_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_images_id_seq OWNED BY public.review_images.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    comment text,
    rating integer NOT NULL,
    status character varying(255) NOT NULL,
    costume_id bigint NOT NULL,
    rental_order_detail_id bigint NOT NULL,
    user_id bigint NOT NULL,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT reviews_status_check CHECK (((status)::text = ANY ((ARRAY['VISIBLE'::character varying, 'HIDDEN_BY_ADMIN'::character varying])::text[])))
);


--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reviews_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: try_on_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.try_on_history (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    error_message text,
    generated_image_url text,
    original_image_url text NOT NULL,
    product_id bigint,
    product_name character varying(255),
    status character varying(20) NOT NULL,
    user_id bigint NOT NULL
);


--
-- Name: try_on_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.try_on_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: try_on_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.try_on_history_id_seq OWNED BY public.try_on_history.id;


--
-- Name: upload_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.upload_assets (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    format character varying(255) NOT NULL,
    original_file_name character varying(255) NOT NULL,
    public_id character varying(255) NOT NULL,
    resource_type character varying(255) NOT NULL,
    secure_url text NOT NULL,
    size bigint NOT NULL,
    url text NOT NULL,
    uploaded_by_user_id bigint NOT NULL
);


--
-- Name: upload_assets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.upload_assets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: upload_assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.upload_assets_id_seq OWNED BY public.upload_assets.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    address character varying(255),
    bank_account_name character varying(255),
    bank_account_number character varying(255),
    bank_name character varying(255),
    consecutive_cancel_count integer,
    email character varying(255) NOT NULL,
    email_verified boolean,
    full_name character varying(255),
    password_hash character varying(255) NOT NULL,
    phone character varying(255),
    phone_verified boolean,
    role character varying(255),
    status character varying(255),
    CONSTRAINT user_role_check CHECK (((role)::text = ANY ((ARRAY['CUSTOMER'::character varying, 'STAFF'::character varying, 'ADMIN'::character varying])::text[]))),
    CONSTRAINT user_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'BLOCKED'::character varying])::text[])))
);


--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: user_interaction_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_interaction_events (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    event_type character varying(40) NOT NULL,
    metadata_json text,
    page_path character varying(255),
    query_text text,
    session_id character varying(120) NOT NULL,
    target_id character varying(120),
    target_type character varying(40),
    user_id bigint,
    CONSTRAINT user_interaction_events_event_type_check CHECK (((event_type)::text = ANY ((ARRAY['VIEW_PRODUCT'::character varying, 'SEARCH'::character varying, 'ADD_TO_CART'::character varying, 'RENT'::character varying, 'WISHLIST_ADD'::character varying, 'WISHLIST_REMOVE'::character varying])::text[]))),
    CONSTRAINT user_interaction_events_target_type_check CHECK (((target_type)::text = ANY ((ARRAY['COSTUME'::character varying, 'CATEGORY'::character varying, 'CART'::character varying, 'ORDER'::character varying, 'SEARCH'::character varying, 'WISHLIST'::character varying])::text[])))
);


--
-- Name: user_interaction_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_interaction_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_interaction_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_interaction_events_id_seq OWNED BY public.user_interaction_events.id;


--
-- Name: advertisements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advertisements ALTER COLUMN id SET DEFAULT nextval('public.advertisements_id_seq'::regclass);


--
-- Name: ai_insights id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_insights ALTER COLUMN id SET DEFAULT nextval('public.ai_insights_id_seq'::regclass);


--
-- Name: cart_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN id SET DEFAULT nextval('public.cart_items_id_seq'::regclass);


--
-- Name: carts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts ALTER COLUMN id SET DEFAULT nextval('public.carts_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: chat_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_sessions ALTER COLUMN id SET DEFAULT nextval('public.chat_sessions_id_seq'::regclass);


--
-- Name: clubs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clubs ALTER COLUMN id SET DEFAULT nextval('public.clubs_id_seq'::regclass);


--
-- Name: costume_images id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costume_images ALTER COLUMN id SET DEFAULT nextval('public.costume_images_id_seq'::regclass);


--
-- Name: costume_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costume_items ALTER COLUMN id SET DEFAULT nextval('public.costume_items_id_seq'::regclass);


--
-- Name: costume_metadata id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costume_metadata ALTER COLUMN id SET DEFAULT nextval('public.costume_metadata_id_seq'::regclass);


--
-- Name: costumes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costumes ALTER COLUMN id SET DEFAULT nextval('public.costumes_id_seq'::regclass);


--
-- Name: event_costumes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_costumes ALTER COLUMN id SET DEFAULT nextval('public.event_costumes_id_seq'::regclass);


--
-- Name: events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- Name: handover_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.handover_records ALTER COLUMN id SET DEFAULT nextval('public.handover_records_id_seq'::regclass);


--
-- Name: otp_verifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_verifications ALTER COLUMN id SET DEFAULT nextval('public.otp_verifications_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: product_ai_metadata id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_ai_metadata ALTER COLUMN id SET DEFAULT nextval('public.product_ai_metadata_id_seq'::regclass);


--
-- Name: product_embeddings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_embeddings ALTER COLUMN id SET DEFAULT nextval('public.product_embeddings_id_seq'::regclass);


--
-- Name: promotions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions ALTER COLUMN id SET DEFAULT nextval('public.promotions_id_seq'::regclass);


--
-- Name: rental_order_details id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_order_details ALTER COLUMN id SET DEFAULT nextval('public.rental_order_details_id_seq'::regclass);


--
-- Name: rental_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_orders ALTER COLUMN id SET DEFAULT nextval('public.rental_orders_id_seq'::regclass);


--
-- Name: review_images id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_images ALTER COLUMN id SET DEFAULT nextval('public.review_images_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: try_on_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.try_on_history ALTER COLUMN id SET DEFAULT nextval('public.try_on_history_id_seq'::regclass);


--
-- Name: upload_assets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upload_assets ALTER COLUMN id SET DEFAULT nextval('public.upload_assets_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Name: user_interaction_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_interaction_events ALTER COLUMN id SET DEFAULT nextval('public.user_interaction_events_id_seq'::regclass);


--
-- Name: advertisements advertisements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advertisements
    ADD CONSTRAINT advertisements_pkey PRIMARY KEY (id);


--
-- Name: ai_insights ai_insights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_insights
    ADD CONSTRAINT ai_insights_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_sessions chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_pkey PRIMARY KEY (id);


--
-- Name: clubs clubs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT clubs_pkey PRIMARY KEY (id);


--
-- Name: costume_images costume_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costume_images
    ADD CONSTRAINT costume_images_pkey PRIMARY KEY (id);


--
-- Name: costume_items costume_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costume_items
    ADD CONSTRAINT costume_items_pkey PRIMARY KEY (id);


--
-- Name: costume_metadata costume_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costume_metadata
    ADD CONSTRAINT costume_metadata_pkey PRIMARY KEY (id);


--
-- Name: costumes costumes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costumes
    ADD CONSTRAINT costumes_pkey PRIMARY KEY (id);


--
-- Name: event_costumes event_costumes_event_id_costume_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_costumes
    ADD CONSTRAINT event_costumes_event_id_costume_id_key UNIQUE (event_id, costume_id);


--
-- Name: event_costumes event_costumes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_costumes
    ADD CONSTRAINT event_costumes_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: handover_records handover_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.handover_records
    ADD CONSTRAINT handover_records_pkey PRIMARY KEY (id);


--
-- Name: otp_verifications idx_otp_email; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_verifications
    ADD CONSTRAINT idx_otp_email UNIQUE (email);


--
-- Name: otp_verifications otp_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_verifications
    ADD CONSTRAINT otp_verifications_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: product_ai_metadata product_ai_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_ai_metadata
    ADD CONSTRAINT product_ai_metadata_pkey PRIMARY KEY (id);


--
-- Name: product_embeddings product_embeddings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_embeddings
    ADD CONSTRAINT product_embeddings_pkey PRIMARY KEY (id);


--
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (id);


--
-- Name: rental_order_details rental_order_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_order_details
    ADD CONSTRAINT rental_order_details_pkey PRIMARY KEY (id);


--
-- Name: rental_orders rental_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_orders
    ADD CONSTRAINT rental_orders_pkey PRIMARY KEY (id);


--
-- Name: review_images review_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_images
    ADD CONSTRAINT review_images_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: try_on_history try_on_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.try_on_history
    ADD CONSTRAINT try_on_history_pkey PRIMARY KEY (id);


--
-- Name: events uk_153gnccmeyks5dlt154kkgch5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT uk_153gnccmeyks5dlt154kkgch5 UNIQUE (slug);


--
-- Name: costume_metadata uk_1tinia0lgoscg739bdl9700k; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costume_metadata
    ADD CONSTRAINT uk_1tinia0lgoscg739bdl9700k UNIQUE (costume_id);


--
-- Name: product_embeddings uk_650kbtl5xs1rwxvr7d0y2hppg; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_embeddings
    ADD CONSTRAINT uk_650kbtl5xs1rwxvr7d0y2hppg UNIQUE (costume_id);


--
-- Name: clubs uk_7x7wph0bo1s930dmfh32t3soh; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT uk_7x7wph0bo1s930dmfh32t3soh UNIQUE (name);


--
-- Name: categories uk_categories_path; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT uk_categories_path UNIQUE (path);


--
-- Name: costume_items uk_fq99ockbfcbx5ws878d9syskl; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costume_items
    ADD CONSTRAINT uk_fq99ockbfcbx5ws878d9syskl UNIQUE (sku);


--
-- Name: promotions uk_jdho73ymbyu46p2hh562dk4kk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT uk_jdho73ymbyu46p2hh562dk4kk UNIQUE (code);


--
-- Name: upload_assets uk_jj589uu8x6f9yj9ev5vv4i734; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upload_assets
    ADD CONSTRAINT uk_jj589uu8x6f9yj9ev5vv4i734 UNIQUE (public_id);


--
-- Name: product_ai_metadata uk_lit52a6v6nc0e5lf6c5ypakb5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_ai_metadata
    ADD CONSTRAINT uk_lit52a6v6nc0e5lf6c5ypakb5 UNIQUE (costume_id);


--
-- Name: chat_sessions uk_nbds8mvm10f5rs8rj2nlx98y9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT uk_nbds8mvm10f5rs8rj2nlx98y9 UNIQUE (session_id);


--
-- Name: user uk_ob8kqyqqgmefl0aco34akdtpe; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT uk_ob8kqyqqgmefl0aco34akdtpe UNIQUE (email);


--
-- Name: costumes uk_qjju0l2lm7rqqcvtkx15yq0qg; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costumes
    ADD CONSTRAINT uk_qjju0l2lm7rqqcvtkx15yq0qg UNIQUE (slug);


--
-- Name: reviews uk_reviews_rental_order_detail_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT uk_reviews_rental_order_detail_id UNIQUE (rental_order_detail_id);


--
-- Name: upload_assets upload_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upload_assets
    ADD CONSTRAINT upload_assets_pkey PRIMARY KEY (id);


--
-- Name: user_interaction_events user_interaction_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_interaction_events
    ADD CONSTRAINT user_interaction_events_pkey PRIMARY KEY (id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: idx_cart_items_cart_id_costume_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cart_items_cart_id_costume_item_id ON public.cart_items USING btree (cart_id, costume_item_id);


--
-- Name: idx_cart_items_costume_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cart_items_costume_item_id ON public.cart_items USING btree (costume_item_id);


--
-- Name: idx_carts_user_id_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_carts_user_id_status ON public.carts USING btree (user_id, status);


--
-- Name: idx_categories_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_is_active ON public.categories USING btree (is_active);


--
-- Name: idx_categories_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_parent_id ON public.categories USING btree (parent_id);


--
-- Name: idx_categories_parent_sort_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_parent_sort_order ON public.categories USING btree (parent_id, sort_order);


--
-- Name: idx_categories_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_path ON public.categories USING btree (path);


--
-- Name: idx_costume_images_costume_id_display_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_costume_images_costume_id_display_order ON public.costume_images USING btree (costume_id, display_order);


--
-- Name: idx_costume_items_costume_id_status_size_color; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_costume_items_costume_id_status_size_color ON public.costume_items USING btree (costume_id, status, size, color);


--
-- Name: idx_costumes_category_id_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_costumes_category_id_status ON public.costumes USING btree (category_id, status);


--
-- Name: idx_costumes_status_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_costumes_status_id ON public.costumes USING btree (status, id);


--
-- Name: idx_event_costumes_costume; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_costumes_costume ON public.event_costumes USING btree (costume_id);


--
-- Name: idx_events_status_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_status_dates ON public.events USING btree (status, start_date, end_date);


--
-- Name: idx_handover_records_rental_order_detail_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_handover_records_rental_order_detail_id_created_at ON public.handover_records USING btree (rental_order_detail_id, created_at);


--
-- Name: idx_interaction_event_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interaction_event_created ON public.user_interaction_events USING btree (event_type, created_at);


--
-- Name: idx_interaction_session_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interaction_session_created ON public.user_interaction_events USING btree (session_id, created_at);


--
-- Name: idx_interaction_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interaction_user_created ON public.user_interaction_events USING btree (user_id, created_at);


--
-- Name: idx_payments_rental_order_id_type_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_rental_order_id_type_status ON public.payments USING btree (rental_order_id, type, status);


--
-- Name: idx_payments_transaction_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_transaction_id ON public.payments USING btree (transaction_id);


--
-- Name: idx_rental_order_details_costume_item_id_rental_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rental_order_details_costume_item_id_rental_order_id ON public.rental_order_details USING btree (costume_item_id, rental_order_id);


--
-- Name: idx_rental_order_details_rental_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rental_order_details_rental_order_id ON public.rental_order_details USING btree (rental_order_id);


--
-- Name: idx_rental_orders_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rental_orders_created_at ON public.rental_orders USING btree (created_at);


--
-- Name: idx_rental_orders_status_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rental_orders_status_created_at ON public.rental_orders USING btree (status, created_at);


--
-- Name: idx_rental_orders_user_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rental_orders_user_id_created_at ON public.rental_orders USING btree (user_id, created_at);


--
-- Name: idx_review_images_review_id_display_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_images_review_id_display_order ON public.review_images USING btree (review_id, display_order);


--
-- Name: idx_reviews_costume_id_status_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_costume_id_status_created_at ON public.reviews USING btree (costume_id, status, created_at);


--
-- Name: idx_user_interaction_events_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_interaction_events_created_at ON public.user_interaction_events USING btree (created_at);


--
-- Name: idx_user_interaction_events_user_id_event_type_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_interaction_events_user_id_event_type_created_at ON public.user_interaction_events USING btree (user_id, event_type, created_at);


--
-- Name: idx_user_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_role_id ON public."user" USING btree (role, id);


--
-- Name: costume_images fk2avf7hnnvceahunl0o7e8ws18; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costume_images
    ADD CONSTRAINT fk2avf7hnnvceahunl0o7e8ws18 FOREIGN KEY (costume_id) REFERENCES public.costumes(id);


--
-- Name: handover_records fk2f2guintf02fevgo2ujv5urmi; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.handover_records
    ADD CONSTRAINT fk2f2guintf02fevgo2ujv5urmi FOREIGN KEY (rental_order_detail_id) REFERENCES public.rental_order_details(id);


--
-- Name: review_images fk3aayo5bjciyemf3bvvt987hkr; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_images
    ADD CONSTRAINT fk3aayo5bjciyemf3bvvt987hkr FOREIGN KEY (review_id) REFERENCES public.reviews(id);


--
-- Name: rental_order_details fk3mp9rwbqrb60ei786fw3kmraw; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_order_details
    ADD CONSTRAINT fk3mp9rwbqrb60ei786fw3kmraw FOREIGN KEY (costume_item_id) REFERENCES public.costume_items(id);


--
-- Name: cart_items fk3ugc4f1pynhcq1gpifm51hc9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT fk3ugc4f1pynhcq1gpifm51hc9 FOREIGN KEY (costume_item_id) REFERENCES public.costume_items(id);


--
-- Name: carts fk4amrtu20mrr5s367qf8q25icq; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT fk4amrtu20mrr5s367qf8q25icq FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: rental_order_details fk6logmxulwo0sym5stdl62pmal; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_order_details
    ADD CONSTRAINT fk6logmxulwo0sym5stdl62pmal FOREIGN KEY (rental_order_id) REFERENCES public.rental_orders(id);


--
-- Name: costume_metadata fk81utuumn8s83abuecsfwes8yq; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costume_metadata
    ADD CONSTRAINT fk81utuumn8s83abuecsfwes8yq FOREIGN KEY (costume_id) REFERENCES public.costumes(id);


--
-- Name: review_images fk83dc80tgeavaju8fa3vp93tlw; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_images
    ADD CONSTRAINT fk83dc80tgeavaju8fa3vp93tlw FOREIGN KEY (upload_asset_id) REFERENCES public.upload_assets(id);


--
-- Name: categories fk_categories_parent; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES public.categories(id);


--
-- Name: promotions fkb5tbuht69pt67j3x1i915w98j; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT fkb5tbuht69pt67j3x1i915w98j FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: costumes fkeatga7xmb91pbhy03qpr62ohr; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costumes
    ADD CONSTRAINT fkeatga7xmb91pbhy03qpr62ohr FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: handover_records fkept0k29o21ry2b4rkt1f8e14p; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.handover_records
    ADD CONSTRAINT fkept0k29o21ry2b4rkt1f8e14p FOREIGN KEY (staff_user_id) REFERENCES public."user"(id);


--
-- Name: chat_sessions fkfnnol9usbw5790d0i1qbhnau2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT fkfnnol9usbw5790d0i1qbhnau2 FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: event_costumes fkg5bcx88wu8eqtkdeemhx2pso7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_costumes
    ADD CONSTRAINT fkg5bcx88wu8eqtkdeemhx2pso7 FOREIGN KEY (costume_id) REFERENCES public.costumes(id);


--
-- Name: reviews fkgi569yy5betu9ywmr8g1jvoey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT fkgi569yy5betu9ywmr8g1jvoey FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: event_costumes fkihflvjaydil179tynsj6vb2n8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_costumes
    ADD CONSTRAINT fkihflvjaydil179tynsj6vb2n8 FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: payments fkip4i064m4whsuid791d1opy08; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fkip4i064m4whsuid791d1opy08 FOREIGN KEY (rental_order_id) REFERENCES public.rental_orders(id);


--
-- Name: costume_metadata_tags fkjq4ybyiwo7r38tuepmsrvi8yc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costume_metadata_tags
    ADD CONSTRAINT fkjq4ybyiwo7r38tuepmsrvi8yc FOREIGN KEY (costume_metadata_id) REFERENCES public.costume_metadata(id);


--
-- Name: rental_orders fkjun6krx63spbpt8ut072vbg5p; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_orders
    ADD CONSTRAINT fkjun6krx63spbpt8ut072vbg5p FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: reviews fkkqubu6se95gwuun55dj5wxodu; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT fkkqubu6se95gwuun55dj5wxodu FOREIGN KEY (costume_id) REFERENCES public.costumes(id);


--
-- Name: user_interaction_events fklvw06kx89uq4wqxu3bgmt4eos; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_interaction_events
    ADD CONSTRAINT fklvw06kx89uq4wqxu3bgmt4eos FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: reviews fkmk33690621ayviphtpksfvsvl; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT fkmk33690621ayviphtpksfvsvl FOREIGN KEY (rental_order_detail_id) REFERENCES public.rental_order_details(id);


--
-- Name: cart_items fkpcttvuq4mxppo8sxggjtn5i2c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT fkpcttvuq4mxppo8sxggjtn5i2c FOREIGN KEY (cart_id) REFERENCES public.carts(id);


--
-- Name: chat_messages fkq7jbjtm2yrr1bwpsma601bhe8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT fkq7jbjtm2yrr1bwpsma601bhe8 FOREIGN KEY (chat_session_id) REFERENCES public.chat_sessions(id);


--
-- Name: upload_assets fkrhoqm9qvleh1dosgd5mabr6ni; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upload_assets
    ADD CONSTRAINT fkrhoqm9qvleh1dosgd5mabr6ni FOREIGN KEY (uploaded_by_user_id) REFERENCES public."user"(id);


--
-- Name: costume_items fkrs376phkxgqfcqhwer0ve1bsd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costume_items
    ADD CONSTRAINT fkrs376phkxgqfcqhwer0ve1bsd FOREIGN KEY (costume_id) REFERENCES public.costumes(id);


--
-- Name: try_on_history fksklpv7fkt1qeb7gvywf21ecm8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.try_on_history
    ADD CONSTRAINT fksklpv7fkt1qeb7gvywf21ecm8 FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- PostgreSQL database dump complete
--


