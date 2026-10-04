import pool from '../db/pool.js';
import { check, integer } from './adminCommon.js';

export function readFilters(raw = {}) {
  check(raw && typeof raw === 'object' && !Array.isArray(raw), 'Bộ lọc chưa hợp lệ.');
  const budget = raw.budget === '' || raw.budget == null ? null : raw.budget;
  const days = raw.days === '' || raw.days == null ? null : raw.days;
  const guests = raw.guests == null || raw.guests === '' ? 1 : raw.guests;
  check(budget === null || integer(budget, 1, 999999999999), 'Ngân sách phải là số nguyên dương (VND/người).');
  check(days === null || integer(days, 1, 60), 'Số ngày tối đa từ 1 đến 60.');
  check(integer(guests, 1, 20), 'Số khách từ 1 đến 20.');
  const region = raw.region ?? '', interest = raw.interest ?? '';
  check(typeof region === 'string' && region.length <= 50 && typeof interest === 'string' && interest.length <= 30, 'Khu vực hoặc sở thích chưa hợp lệ.');
  return { budget: budget === null ? null : Number(budget), days: days === null ? null : Number(days), guests: Number(guests), region: region.trim(), interest: interest.trim() };
}

export async function recommend(filters) {
  // Hard filters in SQL. The model cannot add unpublished/sold-out tours to this list.
  const { rows } = await pool.query(`
    SELECT t.id,t.title,t.description,t.duration_days,t.departure_location,t.image_url,t.tags,
      d.name AS destination,d.region,td.id AS departure_id,to_char(td.start_date,'YYYY-MM-DD') AS start_date,
      td.price_per_person::text AS price_from,(td.capacity-td.seats_booked) AS seats_left
    FROM tours t JOIN destinations d ON d.id=t.destination_id
    JOIN LATERAL (
      SELECT dep.* FROM tour_departures dep WHERE dep.tour_id=t.id AND dep.status='scheduled'
        AND dep.start_date>CURRENT_DATE AND dep.capacity-dep.seats_booked >= $1
        AND ($2::numeric IS NULL OR dep.price_per_person <= $2)
      ORDER BY dep.price_per_person,dep.start_date,dep.id LIMIT 1
    ) td ON true
    WHERE t.status='active' AND ($3::int IS NULL OR t.duration_days <= $3)
      AND ($4='' OR d.region=$4) AND ($5='' OR $5=ANY(t.tags))
    ORDER BY td.price_per_person,td.start_date,t.id LIMIT 12`,
    [filters.guests, filters.budget, filters.days, filters.region, filters.interest]);
  return rows.map(({ description, ...tour }) => ({ ...tour, summary: description.slice(0, 650) }));
}

export async function recommendationOptions() {
  const [regions, interests] = await Promise.all([
    pool.query("SELECT DISTINCT d.region FROM destinations d JOIN tours t ON t.destination_id=d.id WHERE t.status='active' ORDER BY d.region"),
    pool.query("SELECT DISTINCT unnest(tags) AS tag FROM tours WHERE status='active' ORDER BY tag"),
  ]);
  return { regions: regions.rows.map(x => x.region), interests: interests.rows.map(x => x.tag) };
}
