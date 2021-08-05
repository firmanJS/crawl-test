-- public.product definition

-- Drop table

-- DROP TABLE public.product;

CREATE TABLE public.product (
	"name" varchar NULL,
	image text NULL,
	description text NOT NULL,
	price int8 NULL,
	sku varchar(50) NOT NULL,
	stock int8 NULL,
	CONSTRAINT product_pk PRIMARY KEY (sku)
);

-- public.adjustment_transaction definition

-- Drop table

-- DROP TABLE public.adjustment_transaction;

CREATE TABLE public.adjustment_transaction (
	sku varchar(50) NOT NULL,
	qty int8 NOT NULL,
	amount int8 NOT NULL,
	CONSTRAINT adjustment_transaction_pk PRIMARY KEY (sku)
);