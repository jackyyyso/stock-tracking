# Stock Trading Tracker

A modern day trading tracking application built with Next.js, Supabase, Tailwind CSS, and shadcn/ui.

## Features

- Track your trades with entry and exit points
- Monitor your portfolio performance
- View detailed trade history
- Calculate trading metrics
- Modern and responsive UI

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.io/) - Backend and database
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Supabase project:
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Get your project URL and anon key

4. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials

5. Set up the database schema:
   ```sql
   -- Create trades table
   create table trades (
     id uuid default uuid_generate_v4() primary key,
     user_id uuid references auth.users,
     symbol text not null,
     entry_price decimal not null,
     exit_price decimal,
     quantity integer not null,
     entry_date timestamp with time zone not null,
     exit_date timestamp with time zone,
     trade_type text not null,
     profit_loss decimal,
     notes text,
     created_at timestamp with time zone default now()
   );

   -- Create portfolio table
   create table portfolio (
     id uuid default uuid_generate_v4() primary key,
     user_id uuid references auth.users,
     total_value decimal not null,
     cash_balance decimal not null,
     created_at timestamp with time zone default now(),
     updated_at timestamp with time zone default now()
   );

   -- Create performance_metrics table
   create table performance_metrics (
     id uuid default uuid_generate_v4() primary key,
     user_id uuid references auth.users,
     win_rate decimal,
     total_trades integer,
     profitable_trades integer,
     losing_trades integer,
     average_win decimal,
     average_loss decimal,
     largest_win decimal,
     largest_loss decimal,
     created_at timestamp with time zone default now(),
     updated_at timestamp with time zone default now()
   );
   ```

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
