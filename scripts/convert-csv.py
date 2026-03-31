#!/usr/bin/env python3
"""Convert 4 Sales Match CSV exports into DashboardResponse JSON files."""
import csv, json, collections, os, sys, time

LOOKUP_PATH = os.path.join(os.path.dirname(__file__), 'zip-lookup.json')
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'datasets')

FILES = {
    "sales_revenue": os.path.expanduser("~/Downloads/Sales Hiring - SalesMatch - Revenue $1m-$25m.csv"),
    "sales_headcount": os.path.expanduser("~/Downloads/Sales Hiring - SalesMatch - Headcount 1-250.csv"),
    "csm_revenue": os.path.expanduser("~/Downloads/CSM Hiring - SalesMatch - Revenue $1m-$25m.csv"),
    "csm_headcount": os.path.expanduser("~/Downloads/CSM Hiring - SalesMatch - Headcount 1-250.csv"),
}

# State abbreviation to FIPS code
STATE_FIPS = {
    'AL':'01','AK':'02','AZ':'04','AR':'05','CA':'06','CO':'08','CT':'09','DE':'10',
    'DC':'11','FL':'12','GA':'13','HI':'15','ID':'16','IL':'17','IN':'18','IA':'19',
    'KS':'20','KY':'21','LA':'22','ME':'23','MD':'24','MA':'25','MI':'26','MN':'27',
    'MS':'28','MO':'29','MT':'30','NE':'31','NV':'32','NH':'33','NJ':'34','NM':'35',
    'NY':'36','NC':'37','ND':'38','OH':'39','OK':'40','OR':'41','PA':'42','RI':'44',
    'SC':'45','SD':'46','TN':'47','TX':'48','UT':'49','VT':'50','VA':'51','WA':'53',
    'WV':'54','WI':'55','WY':'56','PR':'72',
}

# County FIPS to name (we'll build this from data)
COUNTY_NAMES = {}

def load_lookup():
    with open(LOOKUP_PATH) as f:
        data = json.load(f)
    return data['centroids'], data['counties']

def get_zip(row):
    """Coalesce ZIP from PERSONAL_ZIP, SKIPTRACE_ZIP."""
    z = (row.get('PERSONAL_ZIP') or row.get('SKIPTRACE_ZIP') or '').strip()
    if z:
        z = z.split('.')[0].split('-')[0].strip()  # Handle "12345.0" or "12345-6789"
        z = z.zfill(5)
        if len(z) == 5 and z.isdigit():
            return z
    return None

def get_state(row):
    st = (row.get('PERSONAL_STATE') or row.get('SKIPTRACE_STATE') or '').strip().upper()
    if st and len(st) == 2:
        return st
    return None

def get_city(row):
    return (row.get('PERSONAL_CITY') or row.get('SKIPTRACE_CITY') or '').strip()

def convert_csv(path, centroids, zip2fips):
    start = time.time()

    # Aggregation counters
    county_counts = collections.Counter()  # fips -> total
    county_state = {}  # fips -> state abbr
    zip_counts = collections.Counter()     # zip -> total
    zip_state = {}     # zip -> state abbr

    age_gender = collections.defaultdict(lambda: {'male': 0, 'female': 0, 'unknown': 0})
    income_counts = collections.Counter()
    net_worth_counts = collections.Counter()
    credit_counts = collections.Counter()
    city_counts = collections.Counter()
    language_counts = collections.Counter()
    seniority_counts = collections.Counter()
    married_counts = collections.Counter()  # Y/N
    children_counts = collections.Counter()  # Y/N

    total = 0

    with open(path, 'r', errors='replace') as f:
        reader = csv.DictReader(f)
        for row in reader:
            total += 1

            # Geo
            z = get_zip(row)
            st = get_state(row)

            if z:
                zip_counts[z] += 1
                if st:
                    zip_state[z] = st
                fips = zip2fips.get(z)
                if fips:
                    county_counts[fips] += 1
                    if st:
                        county_state[fips] = st
            elif st:
                # No ZIP but have state — still count for state-level
                pass

            # Age + Gender
            age = (row.get('AGE_RANGE') or '').strip()
            gender = (row.get('GENDER') or '').strip().upper()
            if age:
                bucket = age_gender[age]
                if gender == 'M':
                    bucket['male'] += 1
                elif gender == 'F':
                    bucket['female'] += 1
                else:
                    bucket['unknown'] += 1

            # Income
            inc = (row.get('INCOME_RANGE') or '').strip()
            if inc:
                income_counts[inc] += 1

            # Net worth
            nw = (row.get('NET_WORTH') or '').strip()
            if nw:
                net_worth_counts[nw] += 1

            # Credit rating
            cr = (row.get('SKIPTRACE_CREDIT_RATING') or '').strip().upper()
            if cr and len(cr) == 1:
                credit_counts[cr] += 1

            # City
            city = get_city(row)
            if city and st:
                city_counts[f"{city}, {st}"] += 1

            # Language
            lang = (row.get('SKIPTRACE_LANGUAGE_CODE') or '').strip().upper()
            if lang:
                language_counts[lang] += 1

            # Seniority
            sen = (row.get('SENIORITY_LEVEL') or '').strip().lower()
            if sen:
                seniority_counts[sen] += 1

            # Married / Children
            m = (row.get('MARRIED') or '').strip().upper()
            if m in ('Y', 'N'):
                married_counts[m] += 1
            ch = (row.get('CHILDREN') or '').strip().upper()
            if ch in ('Y', 'N'):
                children_counts[ch] += 1

    # Build DashboardResponse

    # Geo counties
    geo_counties = []
    for fips, count in county_counts.most_common():
        geo_counties.append({
            'fips': fips,
            'state': county_state.get(fips, ''),
            'name': '',  # PMTiles have the name
            'high': 0, 'medium': 0, 'low': count, 'total': count,
        })

    # Geo zips
    geo_zips = []
    for z, count in zip_counts.most_common():
        coords = centroids.get(z)
        lat = coords[0] if coords else None
        lng = coords[1] if coords else None
        geo_zips.append({
            'zip': z,
            'state': zip_state.get(z, ''),
            'county_fips': zip2fips.get(z, ''),
            'lat': lat, 'lng': lng,
            'high': 0, 'medium': 0, 'low': count, 'total': count,
        })

    # Age/gender buckets
    age_order = ['18-24', '25-34', '35-44', '45-54', '55-64', '65 and older']
    age_gender_agg = []
    for age in age_order:
        if age in age_gender:
            b = age_gender[age]
            age_gender_agg.append({'age_range': age, **b})
    # Include any not in standard order
    for age in sorted(age_gender.keys()):
        if age not in age_order:
            b = age_gender[age]
            age_gender_agg.append({'age_range': age, **b})

    # Family dynamics
    mY = married_counts.get('Y', 0)
    mN = married_counts.get('N', 0)
    cY = children_counts.get('Y', 0)
    cN = children_counts.get('N', 0)
    mTotal = mY + mN or 1
    cTotal = cY + cN or 1
    family = {
        'married_children': round(mY * cY / mTotal),
        'married_no_children': round(mY * cN / mTotal),
        'single_children': round(mN * cY / cTotal),
        'single_no_children': round(mN * cN / cTotal),
    }

    # Build filter options
    all_cities = [{'value': c, 'count': n} for c, n in city_counts.most_common(200)]

    # County filter options
    county_options = []
    for fips, count in county_counts.most_common(500):
        county_options.append({
            'fips': fips,
            'name': fips,  # Frontend uses PMTiles for names
            'state': county_state.get(fips, ''),
            'count': count,
        })

    # Language filter options
    lang_options = [{'code': c, 'count': n} for c, n in language_counts.most_common(50)]

    response = {
        'totalContacts': total,
        'filteredContacts': total,
        'geo': {
            'counties': geo_counties,
            'zips': geo_zips,
        },
        'tooltipGeo': None,
        'aggregations': {
            'age_gender': age_gender_agg,
            'income': [{'bucket': b, 'count': c} for b, c in income_counts.most_common()],
            'net_worth': [{'bucket': b, 'count': c} for b, c in net_worth_counts.most_common()],
            'credit_rating': [{'bucket': b, 'count': c} for b, c in credit_counts.most_common()],
            'top_cities': [{'city': c, 'count': n} for c, n in city_counts.most_common(25)],
            'language': [{'code': c, 'count': n} for c, n in language_counts.most_common(50)],
            'family': family,
            'seniority': [{'level': l, 'count': c} for l, c in seniority_counts.most_common()],
        },
        'filterOptions': {
            'cities': all_cities,
            'counties': county_options,
            'languages': lang_options,
        },
        'ms': 0,
    }

    elapsed = time.time() - start
    print(f"  {total} rows, {len(geo_counties)} counties, {len(geo_zips)} zips in {elapsed:.1f}s")
    return response


def main():
    print("Loading ZIP lookup...")
    centroids, zip2fips = load_lookup()
    print(f"  {len(centroids)} centroids, {len(zip2fips)} county mappings")

    os.makedirs(OUT_DIR, exist_ok=True)

    for key, path in FILES.items():
        print(f"\nConverting {key}...")
        response = convert_csv(path, centroids, zip2fips)
        out_path = os.path.join(OUT_DIR, f'{key}.json')
        with open(out_path, 'w') as f:
            json.dump(response, f)
        size_kb = os.path.getsize(out_path) / 1024
        print(f"  Written {out_path} ({size_kb:.0f} KB)")

    # Write index
    index = {k: f'/datasets/{k}.json' for k in FILES}
    with open(os.path.join(OUT_DIR, 'index.json'), 'w') as f:
        json.dump(index, f, indent=2)
    print(f"\nAll done. Index written to {OUT_DIR}/index.json")


if __name__ == '__main__':
    main()
