(function () {
  const PHONE_NOTE = 'Format-valid test number. Not guaranteed callable or SMS-capable.';
  const ADDRESS_KIND = 'Public, commercial, or postal test address.';
  const RESERVED_DOMAINS = ['example.com', 'example.net', 'example.org'];

  const COUNTRY_PROFILES = {
    ae: {
      countryCode: 'AE',
      countryName: 'United Arab Emirates',
      regionLabel: 'Emirate',
      postalLabel: 'Postal code',
      names: {
        male: [
          { latin: 'Omar', arabic: 'عمر' },
          { latin: 'Ahmed', arabic: 'أحمد' },
          { latin: 'Khalid', arabic: 'خالد' },
          { latin: 'Saif', arabic: 'سيف' },
          { latin: 'Hamdan', arabic: 'حمدان' },
          { latin: 'Rashid', arabic: 'راشد' },
          { latin: 'Mohammed', arabic: 'محمد' },
          { latin: 'Yousef', arabic: 'يوسف' },
          { latin: 'Abdullah', arabic: 'عبد الله' },
          { latin: 'Sultan', arabic: 'سلطان' },
          { latin: 'Ali', arabic: 'علي' },
          { latin: 'Hassan', arabic: 'حسن' },
          { latin: 'Ibrahim', arabic: 'إبراهيم' },
          { latin: 'Zayed', arabic: 'زايد' },
          { latin: 'Majid', arabic: 'ماجد' },
          { latin: 'Fahad', arabic: 'فهد' },
          { latin: 'Turki', arabic: 'تركي' },
          { latin: 'Hamad', arabic: 'حمد' },
          { latin: 'Saud', arabic: 'سعود' },
          { latin: 'Tariq', arabic: 'طارق' },
          { latin: 'Nasser', arabic: 'ناصر' },
          { latin: 'Marwan', arabic: 'مروان' },
          { latin: 'Mansour', arabic: 'منصور' },
          { latin: 'Eisa', arabic: 'عيسى' },
          { latin: 'Hazza', arabic: 'هزاع' },
        ],
        female: [
          { latin: 'Fatima', arabic: 'فاطمة' },
          { latin: 'Aisha', arabic: 'عائشة' },
          { latin: 'Mariam', arabic: 'مريم' },
          { latin: 'Noora', arabic: 'نورة' },
          { latin: 'Latifa', arabic: 'لطيفة' },
          { latin: 'Salma', arabic: 'سلمى' },
          { latin: 'Huda', arabic: 'هدى' },
          { latin: 'Amna', arabic: 'آمنة' },
          { latin: 'Reem', arabic: 'ريم' },
          { latin: 'Alya', arabic: 'علياء' },
          { latin: 'Layla', arabic: 'ليلى' },
          { latin: 'Dana', arabic: 'دانة' },
          { latin: 'Hessa', arabic: 'حصة' },
          { latin: 'Shamma', arabic: 'شمّة' },
          { latin: 'Maha', arabic: 'مها' },
          { latin: 'Nouf', arabic: 'نوف' },
          { latin: 'Lulwa', arabic: 'لولوة' },
          { latin: 'Shaikha', arabic: 'شيخة' },
          { latin: 'Hind', arabic: 'هند' },
          { latin: 'Buthaina', arabic: 'بثينة' },
          { latin: 'Wadha', arabic: 'وضحى' },
          { latin: 'Maitha', arabic: 'ميثاء' },
          { latin: 'Rawdha', arabic: 'روضة' },
          { latin: 'Mozah', arabic: 'موزة' },
        ],
        last: [
          { latin: 'Al Mansoori', arabic: 'المنصوري' },
          { latin: 'Al Suwaidi', arabic: 'السويدي' },
          { latin: 'Al Nuaimi', arabic: 'النعيمي' },
          { latin: 'Al Ketbi', arabic: 'الكتبي' },
          { latin: 'Al Mazrouei', arabic: 'المزروعي' },
          { latin: 'Al Hammadi', arabic: 'الحمادي' },
          { latin: 'Al Falasi', arabic: 'الفلاسي' },
          { latin: 'Al Qasimi', arabic: 'القاسمي' },
          { latin: 'Al Shehhi', arabic: 'الشحي' },
          { latin: 'Al Marri', arabic: 'المري' },
          { latin: 'Al Blooshi', arabic: 'البلوشي' },
          { latin: 'Al Zaabi', arabic: 'الزعابي' },
          { latin: 'Al Hosani', arabic: 'الحوسني' },
          { latin: 'Al Rashidi', arabic: 'الرشيدي' },
          { latin: 'Al Ameri', arabic: 'العامري' },
          { latin: 'Obaid', arabic: 'عبيد' },
          { latin: 'Al Mehrezi', arabic: 'المحرزي' },
          { latin: 'Al Dhanhani', arabic: 'الظنحاني' },
          { latin: 'Al Kaabi', arabic: 'الكعبي' },
          { latin: 'Al Hashimi', arabic: 'الهاشمي' },
          { latin: 'Al Shamsi', arabic: 'الشامسي' },
          { latin: 'Al Dhaheri', arabic: 'الظاهري' },
          { latin: 'Al Romaithi', arabic: 'الرميثي' },
          { latin: 'Al Kindi', arabic: 'الكندي' },
        ],
      },
      addresses: [
        {
          source: 'The Dubai Mall',
          line1: 'The Dubai Mall',
          line2: 'Financial Center Road, Downtown Dubai',
          city: 'Dubai',
          region: 'Dubai',
          postalCode: '00000',
          poBox: '',
          country: 'United Arab Emirates',
        },
        {
          source: 'Mall of the Emirates',
          line1: 'Mall of the Emirates',
          line2: 'Sheikh Zayed Road, Al Barsha 1',
          city: 'Dubai',
          region: 'Dubai',
          postalCode: '00000',
          poBox: '',
          country: 'United Arab Emirates',
        },
        {
          source: 'Emirates Post Group Head Office',
          line1: 'Emirates Post Group Head Office',
          line2: 'Marrakech Street, Al Garhoud',
          city: 'Dubai',
          region: 'Dubai',
          postalCode: '00000',
          poBox: 'P.O. Box 99999',
          country: 'United Arab Emirates',
        },
        {
          source: 'Abu Dhabi National Exhibition Centre',
          line1: 'Abu Dhabi National Exhibition Centre',
          line2: 'Al Khaleej Al Arabi Street',
          city: 'Abu Dhabi',
          region: 'Abu Dhabi',
          postalCode: '00000',
          poBox: '',
          country: 'United Arab Emirates',
        },
        {
          source: 'Sharjah City Centre',
          line1: 'Sharjah City Centre',
          line2: 'Al Wahda Street',
          city: 'Sharjah',
          region: 'Sharjah',
          postalCode: '00000',
          poBox: '',
          country: 'United Arab Emirates',
        },
        {
          source: 'Al Qasba',
          line1: 'Al Qasba',
          line2: 'Al Khan Area',
          city: 'Sharjah',
          region: 'Sharjah',
          postalCode: '00000',
          poBox: '',
          country: 'United Arab Emirates',
        },
        {
          source: 'Yas Mall',
          line1: 'Yas Mall',
          line2: 'Yas Island',
          city: 'Abu Dhabi',
          region: 'Abu Dhabi',
          postalCode: '00000',
          poBox: '',
          country: 'United Arab Emirates',
        },
        {
          source: 'Al Ain Zoo',
          line1: 'Al Ain Zoo',
          line2: 'Zakher District',
          city: 'Al Ain',
          region: 'Al Ain',
          postalCode: '00000',
          poBox: '',
          country: 'United Arab Emirates',
        },
        {
          source: 'Al Hamra Mall',
          line1: 'Al Hamra Mall',
          line2: 'Sheikh Mohammed bin Salem Road',
          city: 'Ras Al Khaimah',
          region: 'Ras Al Khaimah',
          postalCode: '00000',
          poBox: '',
          country: 'United Arab Emirates',
        },
        {
          source: 'Ajman Museum',
          line1: 'Ajman Museum',
          line2: 'Al Bustan',
          city: 'Ajman',
          region: 'Ajman',
          postalCode: '00000',
          poBox: '',
          country: 'United Arab Emirates',
        },
        {
          source: 'Fujairah Fort',
          line1: 'Fujairah Fort',
          line2: 'Fujairah City',
          city: 'Fujairah',
          region: 'Fujairah',
          postalCode: '00000',
          poBox: '',
          country: 'United Arab Emirates',
        },
        {
          source: 'City Centre Deira',
          line1: 'City Centre Deira',
          line2: '8th Street, Port Saeed',
          city: 'Dubai',
          region: 'Dubai',
          postalCode: '00000',
          poBox: '',
          country: 'United Arab Emirates',
        },
      ],
      mobilePhone: uaeMobilePhone,
      telephone: uaeTelephone,
    },
    us: {
      countryCode: 'US',
      countryName: 'United States',
      regionLabel: 'State',
      postalLabel: 'ZIP code',
      names: {
        male: [
          'James', 'Michael', 'Daniel', 'Ethan', 'Noah', 'Lucas', 'Benjamin', 'Carter', 'Samuel', 'Mason',
          'Alexander', 'William', 'Henry', 'Sebastian', 'Jack', 'Owen', 'Wyatt', 'Leo', 'Julian', 'Grayson',
          'Elijah', 'Mateo', 'Adrian', 'Nathan', 'Ryan', 'Christian', 'Aaron', 'Jordan', 'Isaiah', 'Evan',
          'Connor', 'Hunter', 'Colton', 'Easton', 'Brayden', 'Dominic', 'Xavier', 'Jose', 'Jaxon', 'Parker',
        ],
        female: [
          'Olivia', 'Emma', 'Ava', 'Sophia', 'Mia', 'Grace', 'Harper', 'Chloe', 'Natalie', 'Lily',
          'Amelia', 'Charlotte', 'Isabella', 'Evelyn', 'Abigail', 'Emily', 'Elizabeth', 'Sofia', 'Avery', 'Ella',
          'Scarlett', 'Victoria', 'Aria', 'Madison', 'Layla', 'Penelope', 'Riley', 'Zoey', 'Nora', 'Lillian',
          'Hannah', 'Addison', 'Eleanor', 'Stella', 'Natalia', 'Lucy', 'Skylar', 'Bella', 'Claire', 'Violet',
        ],
        last: [
          'Miller', 'Carter', 'Brooks', 'Parker', 'Bennett', 'Hayes', 'Morgan', 'Foster', 'Reed', 'Coleman',
          'Anderson', 'Murphy', 'Rogers', 'Cook', 'Bailey', 'Rivera', 'Cooper', 'Richardson', 'Cox', 'Howard',
          'Ward', 'Torres', 'Peterson', 'Gray', 'Ramirez', 'Watson', 'Kelly', 'Sanders', 'Price', 'Wood',
          'Barnes', 'Ross', 'Henderson', 'Jenkins', 'Perry', 'Powell', 'Long', 'Patterson', 'Hughes', 'Flores',
        ],
      },
      addresses: [
        {
          source: 'Empire State Building',
          line1: '20 W 34th St',
          line2: 'Empire State Building',
          city: 'New York',
          region: 'NY',
          postalCode: '10001',
          poBox: '',
          country: 'United States',
        },
        {
          source: 'Pike Place Market',
          line1: '85 Pike St',
          line2: 'Pike Place Market',
          city: 'Seattle',
          region: 'WA',
          postalCode: '98101',
          poBox: '',
          country: 'United States',
        },
        {
          source: 'Willis Tower',
          line1: '233 S Wacker Dr',
          line2: 'Willis Tower',
          city: 'Chicago',
          region: 'IL',
          postalCode: '60606',
          poBox: '',
          country: 'United States',
        },
        {
          source: 'Los Angeles Union Station',
          line1: '800 N Alameda St',
          line2: 'Union Station',
          city: 'Los Angeles',
          region: 'CA',
          postalCode: '90012',
          poBox: '',
          country: 'United States',
        },
        {
          source: 'Boston Public Library',
          line1: '700 Boylston St',
          line2: 'Boston Public Library',
          city: 'Boston',
          region: 'MA',
          postalCode: '02116',
          poBox: '',
          country: 'United States',
        },
        {
          source: 'Space Needle',
          line1: '400 Broad St',
          line2: 'Space Needle',
          city: 'Seattle',
          region: 'WA',
          postalCode: '98109',
          poBox: '',
          country: 'United States',
        },
        {
          source: 'Golden Gate Bridge Welcome Center',
          line1: 'Golden Gate Bridge',
          line2: 'Welcome Center',
          city: 'San Francisco',
          region: 'CA',
          postalCode: '94129',
          poBox: '',
          country: 'United States',
        },
        {
          source: 'Smithsonian National Air and Space Museum',
          line1: '600 Independence Ave SW',
          line2: 'National Air and Space Museum',
          city: 'Washington',
          region: 'DC',
          postalCode: '20560',
          poBox: '',
          country: 'United States',
        },
        {
          source: 'Denver Art Museum',
          line1: '100 W 14th Ave Pkwy',
          line2: 'Denver Art Museum',
          city: 'Denver',
          region: 'CO',
          postalCode: '80204',
          poBox: '',
          country: 'United States',
        },
        {
          source: 'Philadelphia Museum of Art',
          line1: '2600 Benjamin Franklin Pkwy',
          line2: 'Philadelphia Museum of Art',
          city: 'Philadelphia',
          region: 'PA',
          postalCode: '19130',
          poBox: '',
          country: 'United States',
        },
        {
          source: 'Phoenix Convention Center',
          line1: '100 N 3rd St',
          line2: 'Phoenix Convention Center',
          city: 'Phoenix',
          region: 'AZ',
          postalCode: '85004',
          poBox: '',
          country: 'United States',
        },
        {
          source: 'Fremont Street Experience',
          line1: '425 E Fremont St',
          line2: 'Fremont Street Experience',
          city: 'Las Vegas',
          region: 'NV',
          postalCode: '89101',
          poBox: '',
          country: 'United States',
        },
        {
          source: 'Portland Art Museum',
          line1: '1219 SW Park Ave',
          line2: 'Portland Art Museum',
          city: 'Portland',
          region: 'OR',
          postalCode: '97205',
          poBox: '',
          country: 'United States',
        },
        {
          source: 'Rock and Roll Hall of Fame',
          line1: '1100 E 9th St',
          line2: 'Rock and Roll Hall of Fame',
          city: 'Cleveland',
          region: 'OH',
          postalCode: '44114',
          poBox: '',
          country: 'United States',
        },
        {
          source: 'Detroit Institute of Arts',
          line1: '5200 Woodward Ave',
          line2: 'Detroit Institute of Arts',
          city: 'Detroit',
          region: 'MI',
          postalCode: '48202',
          poBox: '',
          country: 'United States',
        },
        {
          source: 'Country Music Hall of Fame',
          line1: '222 Rep. John Lewis Way S',
          line2: 'Country Music Hall of Fame',
          city: 'Nashville',
          region: 'TN',
          postalCode: '37203',
          poBox: '',
          country: 'United States',
        },
        {
          source: 'Discovery Place Science',
          line1: '301 N Tryon St',
          line2: 'Discovery Place Science',
          city: 'Charlotte',
          region: 'NC',
          postalCode: '28202',
          poBox: '',
          country: 'United States',
        },
        {
          source: 'Milwaukee Art Museum',
          line1: '700 N Art Museum Dr',
          line2: 'Milwaukee Art Museum',
          city: 'Milwaukee',
          region: 'WI',
          postalCode: '53202',
          poBox: '',
          country: 'United States',
        },
        {
          source: 'Gateway Arch',
          line1: '11 N 4th St',
          line2: 'Gateway Arch',
          city: 'St. Louis',
          region: 'MO',
          postalCode: '63102',
          poBox: '',
          country: 'United States',
        },
        {
          source: 'Frost Bank Tower',
          line1: '401 Congress Ave',
          line2: 'Frost Bank Tower',
          city: 'Austin',
          region: 'TX',
          postalCode: '78701',
          poBox: '',
          country: 'United States',
        },
        {
          source: 'Pérez Art Museum Miami',
          line1: '1103 Biscayne Blvd',
          line2: 'Pérez Art Museum Miami',
          city: 'Miami',
          region: 'FL',
          postalCode: '33132',
          poBox: '',
          country: 'United States',
        },
        {
          source: 'Georgia Aquarium',
          line1: '225 Baker St NW',
          line2: 'Georgia Aquarium',
          city: 'Atlanta',
          region: 'GA',
          postalCode: '30313',
          poBox: '',
          country: 'United States',
        },
      ],
      mobilePhone: usPhone,
      telephone: usPhone,
    },
    gb: {
      countryCode: 'GB',
      countryName: 'United Kingdom',
      regionLabel: 'County / region',
      postalLabel: 'Postcode',
      names: {
        male: [
          'Oliver', 'George', 'Harry', 'Arthur', 'Thomas', 'Freddie', 'Jack', 'Henry', 'Leo', 'Oscar',
          'William', 'James', 'Charlie', 'Alfie', 'Noah', 'Muhammad', 'Ethan', 'Jacob', 'Max', 'Logan',
          'Finley', 'Benjamin', 'Isaac', 'Lucas', 'Alexander', 'Edward', 'Daniel', 'Archie', 'Joseph', 'Samuel',
          'Adam', 'Dylan', 'Harrison', 'Jude', 'Reuben', 'Toby', 'Sebastian', 'Rory', 'Elliot', 'Louis',
        ],
        female: [
          'Amelia', 'Isla', 'Olivia', 'Emily', 'Freya', 'Poppy', 'Sophie', 'Grace', 'Ella', 'Charlotte',
          'Ava', 'Mia', 'Lily', 'Evie', 'Florence', 'Willow', 'Rosie', 'Sophia', 'Ivy', 'Harper',
          'Elsie', 'Sienna', 'Phoebe', 'Esme', 'Ruby', 'Daisy', 'Alice', 'Matilda', 'Emilia', 'Chloe',
          'Hannah', 'Nancy', 'Zara', 'Penelope', 'Violet', 'Lucy', 'Eleanor', 'Maya', 'Hallie', 'Nora',
        ],
        last: [
          'Smith', 'Taylor', 'Brown', 'Wilson', 'Evans', 'Walker', 'Davies', 'Hughes', 'Green', 'Clarke',
          'Johnson', 'Robinson', 'Wright', 'Thompson', 'White', 'Hall', 'Lewis', 'Harris', 'Martin', 'Jackson',
          'Clark', 'Young', 'Allen', 'King', 'Shaw', 'Scott', 'Adams', 'Baker', 'Hill', 'Nelson',
          'Campbell', 'Mitchell', 'Roberts', 'Carter', 'Phillips', 'Turner', 'Parker', 'Collins', 'Edwards', 'Stewart',
        ],
      },
      addresses: [
        {
          source: 'British Museum',
          line1: 'Great Russell Street',
          line2: 'British Museum',
          city: 'London',
          region: 'Greater London',
          postalCode: 'WC1B 3DG',
          poBox: '',
          country: 'United Kingdom',
        },
        {
          source: 'Tate Modern',
          line1: 'Bankside',
          line2: 'Tate Modern',
          city: 'London',
          region: 'Greater London',
          postalCode: 'SE1 9TG',
          poBox: '',
          country: 'United Kingdom',
        },
        {
          source: 'British Library',
          line1: '96 Euston Road',
          line2: 'British Library',
          city: 'London',
          region: 'Greater London',
          postalCode: 'NW1 2DB',
          poBox: '',
          country: 'United Kingdom',
        },
        {
          source: 'Manchester Central Library',
          line1: "St Peter's Square",
          line2: 'Manchester Central Library',
          city: 'Manchester',
          region: 'Greater Manchester',
          postalCode: 'M2 5PD',
          poBox: '',
          country: 'United Kingdom',
        },
        {
          source: 'National Museum of Scotland',
          line1: 'Chambers Street',
          line2: 'National Museum of Scotland',
          city: 'Edinburgh',
          region: 'Scotland',
          postalCode: 'EH1 1JF',
          poBox: '',
          country: 'United Kingdom',
        },
        {
          source: 'Library of Birmingham',
          line1: 'Centenary Square',
          line2: 'Library of Birmingham',
          city: 'Birmingham',
          region: 'West Midlands',
          postalCode: 'B1 2EA',
          poBox: '',
          country: 'United Kingdom',
        },
        {
          source: 'World Museum',
          line1: 'William Brown Street',
          line2: 'World Museum',
          city: 'Liverpool',
          region: 'Merseyside',
          postalCode: 'L3 8EN',
          poBox: '',
          country: 'United Kingdom',
        },
        {
          source: 'Royal Armouries Museum',
          line1: 'Armouries Drive',
          line2: 'Royal Armouries Museum',
          city: 'Leeds',
          region: 'West Yorkshire',
          postalCode: 'LS10 1LT',
          poBox: '',
          country: 'United Kingdom',
        },
        {
          source: 'Kelvingrove Art Gallery and Museum',
          line1: 'Argyle Street',
          line2: 'Kelvingrove Art Gallery and Museum',
          city: 'Glasgow',
          region: 'Scotland',
          postalCode: 'G3 8AG',
          poBox: '',
          country: 'United Kingdom',
        },
        {
          source: 'National Museum Cardiff',
          line1: 'Cathays Park',
          line2: 'National Museum Cardiff',
          city: 'Cardiff',
          region: 'Wales',
          postalCode: 'CF10 3NP',
          poBox: '',
          country: 'United Kingdom',
        },
        {
          source: 'Bristol Museum & Art Gallery',
          line1: "Queen's Road",
          line2: 'Bristol Museum & Art Gallery',
          city: 'Bristol',
          region: 'Bristol',
          postalCode: 'BS8 1RL',
          poBox: '',
          country: 'United Kingdom',
        },
        {
          source: 'Oxford University Museum of Natural History',
          line1: 'Parks Road',
          line2: 'Oxford University Museum of Natural History',
          city: 'Oxford',
          region: 'Oxfordshire',
          postalCode: 'OX1 3PW',
          poBox: '',
          country: 'United Kingdom',
        },
        {
          source: 'Fitzwilliam Museum',
          line1: 'Trumpington Street',
          line2: 'Fitzwilliam Museum',
          city: 'Cambridge',
          region: 'Cambridgeshire',
          postalCode: 'CB2 1RB',
          poBox: '',
          country: 'United Kingdom',
        },
        {
          source: 'Royal Albert Memorial Museum',
          line1: 'Queen Street',
          line2: 'Royal Albert Memorial Museum',
          city: 'Exeter',
          region: 'Devon',
          postalCode: 'EX4 3RX',
          poBox: '',
          country: 'United Kingdom',
        },
        {
          source: 'Belfast City Hall',
          line1: 'Donegall Square',
          line2: 'Belfast City Hall',
          city: 'Belfast',
          region: 'Northern Ireland',
          postalCode: 'BT1 5GS',
          poBox: '',
          country: 'United Kingdom',
        },
      ],
      mobilePhone: ukMobilePhone,
      telephone: ukTelephone,
    },
    sg: {
      countryCode: 'SG',
      countryName: 'Singapore',
      regionLabel: 'Region',
      postalLabel: 'Postal code',
      names: {
        male: [
          'Wei Jie', 'Jun Hao', 'Arjun', 'Hafiz', 'Darren', 'Marcus', 'Ryan', 'Isaac', 'Zhi Wei', 'Haziq',
          'Kai Wen', 'Jia Hao', 'Ravi', 'Wei Lun', 'Shawn', 'Ethan', 'Nikhil', 'Aryan', 'Daniel', 'Jayden',
          'Lucas', 'Benjamin', 'Kumar', 'Vikram', 'Imran', 'Faris', 'Zheng Hao', 'Bryan', 'Kenji', 'Omar',
          'Ahmad', 'Rizwan', 'Harish', 'Siddharth', 'Tian Yi', 'Jing Xuan', 'Andre', 'Calvin', 'Wayne', 'Irfan',
        ],
        female: [
          'Mei Lin', 'Xin Yi', 'Priya', 'Nur Aisyah', 'Sarah', 'Chloe', 'Jia En', 'Anika', 'Siti', 'Rachel',
          'Hui Min', 'Shi Qi', 'Deepa', 'Nurul', 'Emily', 'Sophia', 'Amanda', 'Zara', 'Aisha', 'Farah',
          'Li Na', 'Yuki', 'Kavitha', 'Divya', 'Nisha', 'Hannah', 'Isabelle', 'Valerie', 'Joanne', 'Sabrina',
          'Michelle', 'Jasmine', 'Aysha', 'Nadia', 'Grace', 'Vanessa', 'Sharon', 'Pei Wen', 'Yu Xuan', 'Linnea',
        ],
        last: [
          'Tan', 'Lim', 'Lee', 'Ng', 'Wong', 'Koh', 'Chua', 'Patel', 'Rajan', 'Abdullah',
          'Goh', 'Teo', 'Ho', 'Chan', 'Cheong', 'Yeo', 'Sim', 'Ong', 'Tay', 'Low',
          'Menon', 'Iyer', 'Krishnan', 'Fernandez', 'Rodrigues', 'Khan', 'Hussain', 'Rahman', 'Gupta', 'Sharma',
          'Chen', 'Liu', 'Zhang', 'Wang', 'Nguyen', 'Phua', 'Seah', 'Toh', 'Ang', 'Lau',
        ],
      },
      addresses: [
        {
          source: 'Marina Bay Sands',
          line1: '10 Bayfront Avenue',
          line2: 'Marina Bay Sands',
          city: 'Singapore',
          region: 'Singapore',
          postalCode: '018956',
          poBox: '',
          country: 'Singapore',
        },
        {
          source: 'ION Orchard',
          line1: '2 Orchard Turn',
          line2: 'ION Orchard',
          city: 'Singapore',
          region: 'Singapore',
          postalCode: '238801',
          poBox: '',
          country: 'Singapore',
        },
        {
          source: 'Singapore Post Centre',
          line1: '10 Eunos Road 8',
          line2: 'Singapore Post Centre',
          city: 'Singapore',
          region: 'Singapore',
          postalCode: '408600',
          poBox: '',
          country: 'Singapore',
        },
        {
          source: 'Changi Airport Terminal 3',
          line1: '65 Airport Boulevard',
          line2: 'Changi Airport Terminal 3',
          city: 'Singapore',
          region: 'Singapore',
          postalCode: '819663',
          poBox: '',
          country: 'Singapore',
        },
        {
          source: 'Suntec City',
          line1: '3 Temasek Boulevard',
          line2: 'Suntec City',
          city: 'Singapore',
          region: 'Singapore',
          postalCode: '038983',
          poBox: '',
          country: 'Singapore',
        },
        {
          source: 'Jewel Changi Airport',
          line1: '78 Airport Boulevard',
          line2: 'Jewel Changi Airport',
          city: 'Singapore',
          region: 'Singapore',
          postalCode: '819666',
          poBox: '',
          country: 'Singapore',
        },
        {
          source: 'Raffles City Singapore',
          line1: '252 North Bridge Road',
          line2: 'Raffles City Singapore',
          city: 'Singapore',
          region: 'Singapore',
          postalCode: '179103',
          poBox: '',
          country: 'Singapore',
        },
        {
          source: 'VivoCity',
          line1: '1 HarbourFront Walk',
          line2: 'VivoCity',
          city: 'Singapore',
          region: 'Singapore',
          postalCode: '098585',
          poBox: '',
          country: 'Singapore',
        },
        {
          source: 'National Gallery Singapore',
          line1: '1 St Andrew\'s Road',
          line2: 'National Gallery Singapore',
          city: 'Singapore',
          region: 'Singapore',
          postalCode: '178957',
          poBox: '',
          country: 'Singapore',
        },
        {
          source: 'Gardens by the Bay',
          line1: '18 Marina Gardens Drive',
          line2: 'Gardens by the Bay',
          city: 'Singapore',
          region: 'Singapore',
          postalCode: '018953',
          poBox: '',
          country: 'Singapore',
        },
        {
          source: 'Singapore Sports Hub',
          line1: '1 Stadium Drive',
          line2: 'Singapore Sports Hub',
          city: 'Singapore',
          region: 'Singapore',
          postalCode: '397629',
          poBox: '',
          country: 'Singapore',
        },
        {
          source: 'Funan Mall',
          line1: '107 North Bridge Road',
          line2: 'Funan',
          city: 'Singapore',
          region: 'Singapore',
          postalCode: '179105',
          poBox: '',
          country: 'Singapore',
        },
      ],
      mobilePhone: sgMobilePhone,
      telephone: sgTelephone,
    },
    ca: {
      countryCode: 'CA',
      countryName: 'Canada',
      regionLabel: 'Province / territory',
      postalLabel: 'Postal code',
      names: {
        male: [
          'Liam', 'Noah', 'Oliver', 'Ethan', 'Lucas', 'Benjamin', 'Henry', 'Alexander', 'Mason', 'William',
          'James', 'Jack', 'Leo', 'Jackson', 'Logan', 'Jacob', 'Owen', 'Theodore', 'Aiden', 'Ryan',
          'Nathan', 'Connor', 'Caleb', 'Isaac', 'Hunter', 'Jayden', 'Thomas', 'Daniel', 'Matthew', 'Gabriel',
        ],
        female: [
          'Olivia', 'Emma', 'Charlotte', 'Amelia', 'Sophia', 'Isabella', 'Ava', 'Mia', 'Chloe', 'Lily',
          'Emily', 'Abigail', 'Ella', 'Hannah', 'Nora', 'Zoey', 'Grace', 'Victoria', 'Aria', 'Scarlett',
          'Penelope', 'Layla', 'Riley', 'Natalie', 'Hailey', 'Brooklyn', 'Anna', 'Claire', 'Lucy', 'Stella',
        ],
        last: [
          'Smith', 'Brown', 'Tremblay', 'Martin', 'Roy', 'Wilson', 'MacDonald', 'Gagnon', 'Johnson', 'Taylor',
          'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Lee',
          'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Nelson',
        ],
      },
      addresses: [
        {
          source: 'CN Tower',
          line1: '290 Bremner Boulevard',
          line2: 'CN Tower',
          city: 'Toronto',
          region: 'ON',
          postalCode: 'M5V 3L9',
          poBox: '',
          country: 'Canada',
        },
        {
          source: 'Canada Place',
          line1: '999 Canada Place',
          line2: 'Canada Place',
          city: 'Vancouver',
          region: 'BC',
          postalCode: 'V6C 3T4',
          poBox: '',
          country: 'Canada',
        },
        {
          source: 'Notre-Dame Basilica of Montreal',
          line1: '110 Notre-Dame Street West',
          line2: 'Notre-Dame Basilica',
          city: 'Montreal',
          region: 'QC',
          postalCode: 'H2Y 1T1',
          poBox: '',
          country: 'Canada',
        },
        {
          source: 'Calgary Tower',
          line1: '101 9 Avenue SW',
          line2: 'Calgary Tower',
          city: 'Calgary',
          region: 'AB',
          postalCode: 'T2P 1J9',
          poBox: '',
          country: 'Canada',
        },
        {
          source: 'Parliament Hill',
          line1: 'Wellington Street',
          line2: 'Parliament Hill',
          city: 'Ottawa',
          region: 'ON',
          postalCode: 'K1A 0A6',
          poBox: '',
          country: 'Canada',
        },
        {
          source: 'Halifax Citadel National Historic Site',
          line1: '5425 Sackville Street',
          line2: 'Halifax Citadel',
          city: 'Halifax',
          region: 'NS',
          postalCode: 'B3J 3J3',
          poBox: '',
          country: 'Canada',
        },
        {
          source: 'The Forks',
          line1: '1 Forks Market Road',
          line2: 'The Forks',
          city: 'Winnipeg',
          region: 'MB',
          postalCode: 'R3C 4L8',
          poBox: '',
          country: 'Canada',
        },
        {
          source: 'Royal Saskatchewan Museum',
          line1: '2445 Albert Street',
          line2: 'Royal Saskatchewan Museum',
          city: 'Regina',
          region: 'SK',
          postalCode: 'S4P 4W7',
          poBox: '',
          country: 'Canada',
        },
      ],
      mobilePhone: caPhone,
      telephone: caPhone,
    },
    de: {
      countryCode: 'DE',
      countryName: 'Germany',
      regionLabel: 'State / Land',
      postalLabel: 'Postcode',
      names: {
        male: [
          'Paul', 'Leon', 'Finn', 'Noah', 'Elias', 'Luca', 'Emil', 'Henry', 'Anton', 'Theo',
          'Felix', 'Max', 'Ben', 'Jonas', 'Liam', 'Matteo', 'Louis', 'Oskar', 'Karl', 'Jakob',
          'Luis', 'Moritz', 'Aaron', 'Julian', 'Tim', 'Tom', 'Samuel', 'David', 'Niklas', 'Philipp',
        ],
        female: [
          'Emma', 'Mia', 'Hannah', 'Emilia', 'Lina', 'Ella', 'Clara', 'Marie', 'Leni', 'Lea',
          'Sophia', 'Lia', 'Mila', 'Ida', 'Frieda', 'Mathilda', 'Amelie', 'Lilly', 'Nora', 'Laura',
          'Charlotte', 'Helena', 'Paula', 'Greta', 'Lotte', 'Elisa', 'Marlene', 'Zoe', 'Jana', 'Sarah',
        ],
        last: [
          'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann',
          'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann',
          'Braun', 'Krüger', 'Hofmann', 'Hartmann', 'Lange', 'Schmitt', 'Werner', 'Schmitz', 'Krause', 'Meier',
        ],
      },
      addresses: [
        {
          source: 'Brandenburg Gate',
          line1: 'Pariser Platz',
          line2: 'Brandenburg Gate',
          city: 'Berlin',
          region: 'Berlin',
          postalCode: '10117',
          poBox: '',
          country: 'Germany',
        },
        {
          source: 'Marienplatz',
          line1: 'Marienplatz',
          line2: 'New Town Hall',
          city: 'Munich',
          region: 'Bavaria',
          postalCode: '80331',
          poBox: '',
          country: 'Germany',
        },
        {
          source: 'Miniatur Wunderland',
          line1: 'Kehrwieder 2-4',
          line2: 'Speicherstadt',
          city: 'Hamburg',
          region: 'Hamburg',
          postalCode: '20457',
          poBox: '',
          country: 'Germany',
        },
        {
          source: 'Cologne Cathedral',
          line1: 'Domkloster 4',
          line2: 'Cologne Cathedral',
          city: 'Cologne',
          region: 'North Rhine-Westphalia',
          postalCode: '50667',
          poBox: '',
          country: 'Germany',
        },
        {
          source: 'Römer',
          line1: 'Römerberg',
          line2: 'Römer city hall',
          city: 'Frankfurt',
          region: 'Hesse',
          postalCode: '60311',
          poBox: '',
          country: 'Germany',
        },
        {
          source: 'Mercedes-Benz Museum',
          line1: 'Mercedesstraße 100',
          line2: 'Mercedes-Benz Museum',
          city: 'Stuttgart',
          region: 'Baden-Württemberg',
          postalCode: '70372',
          poBox: '',
          country: 'Germany',
        },
        {
          source: 'Zwinger',
          line1: 'Theaterplatz 1',
          line2: 'Zwinger',
          city: 'Dresden',
          region: 'Saxony',
          postalCode: '01067',
          poBox: '',
          country: 'Germany',
        },
        {
          source: 'Düsseldorf Rhine promenade',
          line1: 'Burgplatz',
          line2: 'Rhine embankment promenade',
          city: 'Düsseldorf',
          region: 'North Rhine-Westphalia',
          postalCode: '40213',
          poBox: '',
          country: 'Germany',
        },
      ],
      mobilePhone: deMobilePhone,
      telephone: deTelephone,
    },
    fr: {
      countryCode: 'FR',
      countryName: 'France',
      regionLabel: 'Region',
      postalLabel: 'Postal code',
      names: {
        male: [
          'Gabriel', 'Léo', 'Raphaël', 'Arthur', 'Louis', 'Lucas', 'Adam', 'Hugo', 'Nathan', 'Ethan',
          'Noah', 'Tom', 'Sacha', 'Maxime', 'Paul', 'Antoine', 'Jules', 'Théo', 'Enzo', 'Mathis',
          'Alexandre', 'Thomas', 'Nicolas', 'Julien', 'Pierre', 'Olivier', 'Benjamin', 'Valentin', 'Clément', 'Simon',
        ],
        female: [
          'Emma', 'Jade', 'Louise', 'Alice', 'Chloé', 'Lina', 'Rose', 'Anna', 'Julia', 'Inès',
          'Camille', 'Sarah', 'Zoé', 'Manon', 'Léa', 'Clara', 'Élise', 'Charlotte', 'Laura', 'Marie',
          'Pauline', 'Lucie', 'Margaux', 'Juliette', 'Amélie', 'Éva', 'Nina', 'Lisa', 'Agathe', 'Romane',
        ],
        last: [
          'Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent',
          'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier', 'Girard',
          'Bonnet', 'Dupont', 'Lambert', 'Fontaine', 'Rousseau', 'Vincent', 'Muller', 'Lefevre', 'Faure', 'André',
        ],
      },
      addresses: [
        {
          source: 'Louvre Museum',
          line1: 'Rue de Rivoli',
          line2: 'Louvre Museum',
          city: 'Paris',
          region: 'Île-de-France',
          postalCode: '75001',
          poBox: '',
          country: 'France',
        },
        {
          source: 'Basilica of Notre-Dame de Fourvière',
          line1: '8 Place de Fourvière',
          line2: 'Notre-Dame de Fourvière',
          city: 'Lyon',
          region: 'Auvergne-Rhône-Alpes',
          postalCode: '69005',
          poBox: '',
          country: 'France',
        },
        {
          source: 'MuCEM',
          line1: '1 Esplanade du J4',
          line2: 'Museum of European and Mediterranean Civilisations',
          city: 'Marseille',
          region: "Provence-Alpes-Côte d'Azur",
          postalCode: '13002',
          poBox: '',
          country: 'France',
        },
        {
          source: 'Cité de l\'espace',
          line1: 'Avenue Jean Gonord',
          line2: 'Cité de l\'espace',
          city: 'Toulouse',
          region: 'Occitanie',
          postalCode: '31500',
          poBox: '',
          country: 'France',
        },
        {
          source: 'Promenade des Anglais',
          line1: 'Promenade des Anglais',
          line2: 'Waterfront',
          city: 'Nice',
          region: "Provence-Alpes-Côte d'Azur",
          postalCode: '06000',
          poBox: '',
          country: 'France',
        },
        {
          source: 'Les Machines de l\'île',
          line1: 'Parc des Chantiers',
          line2: 'Les Machines de l\'île',
          city: 'Nantes',
          region: 'Pays de la Loire',
          postalCode: '44200',
          poBox: '',
          country: 'France',
        },
        {
          source: 'La Cité du Vin',
          line1: '134 Quai de Bacalan',
          line2: 'La Cité du Vin',
          city: 'Bordeaux',
          region: 'Nouvelle-Aquitaine',
          postalCode: '33300',
          poBox: '',
          country: 'France',
        },
        {
          source: 'Strasbourg Cathedral',
          line1: 'Place de la Cathédrale',
          line2: 'Notre-Dame Cathedral',
          city: 'Strasbourg',
          region: 'Grand Est',
          postalCode: '67000',
          poBox: '',
          country: 'France',
        },
      ],
      mobilePhone: frMobilePhone,
      telephone: frTelephone,
    },
    au: {
      countryCode: 'AU',
      countryName: 'Australia',
      regionLabel: 'State / territory',
      postalLabel: 'Postcode',
      names: {
        male: [
          'Oliver', 'Noah', 'William', 'Leo', 'Lucas', 'Henry', 'Jack', 'Thomas', 'James', 'Ethan',
          'Liam', 'Mason', 'Harrison', 'Charlie', 'Max', 'Oscar', 'Alexander', 'Benjamin', 'Archie', 'Hudson',
          'Cooper', 'Ryan', 'Xavier', 'Patrick', 'Lachlan', 'Flynn', 'Jaxon', 'Zachary', 'Tyler', 'Blake',
        ],
        female: [
          'Olivia', 'Charlotte', 'Amelia', 'Isla', 'Mia', 'Ava', 'Grace', 'Chloe', 'Willow', 'Matilda',
          'Ella', 'Ivy', 'Sophia', 'Zoe', 'Lily', 'Harper', 'Evie', 'Ruby', 'Sophie', 'Emily',
          'Isabella', 'Sienna', 'Hannah', 'Lucy', 'Eva', 'Layla', 'Violet', 'Audrey', 'Stella', 'Poppy',
        ],
        last: [
          'Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Johnson', 'Martin', 'Anderson', 'White',
          'Thompson', 'Lee', 'Walker', 'Harris', 'Ryan', 'Robinson', 'Kelly', 'King', 'Scott', 'Davis',
          'Murphy', 'Clark', 'Young', 'Wright', 'Hill', 'Green', 'Baker', 'Nelson', 'Hall', 'Campbell',
        ],
      },
      addresses: [
        {
          source: 'Sydney Opera House',
          line1: 'Bennelong Point',
          line2: 'Sydney Opera House',
          city: 'Sydney',
          region: 'NSW',
          postalCode: '2000',
          poBox: '',
          country: 'Australia',
        },
        {
          source: 'Federation Square',
          line1: 'Swanston Street',
          line2: 'Federation Square',
          city: 'Melbourne',
          region: 'VIC',
          postalCode: '3000',
          poBox: '',
          country: 'Australia',
        },
        {
          source: 'South Bank Parklands',
          line1: 'Little Stanley Street',
          line2: 'South Bank Parklands',
          city: 'Brisbane',
          region: 'QLD',
          postalCode: '4101',
          poBox: '',
          country: 'Australia',
        },
        {
          source: 'Elizabeth Quay',
          line1: 'The Esplanade',
          line2: 'Elizabeth Quay',
          city: 'Perth',
          region: 'WA',
          postalCode: '6000',
          poBox: '',
          country: 'Australia',
        },
        {
          source: 'Adelaide Oval',
          line1: 'War Memorial Drive',
          line2: 'Adelaide Oval',
          city: 'Adelaide',
          region: 'SA',
          postalCode: '5006',
          poBox: '',
          country: 'Australia',
        },
        {
          source: 'Parliament House',
          line1: 'Parliament Drive',
          line2: 'Parliament House',
          city: 'Canberra',
          region: 'ACT',
          postalCode: '2600',
          poBox: '',
          country: 'Australia',
        },
        {
          source: 'Museum and Art Gallery of the Northern Territory',
          line1: '19 Conacher Street',
          line2: 'MAGNT',
          city: 'Darwin',
          region: 'NT',
          postalCode: '0820',
          poBox: '',
          country: 'Australia',
        },
        {
          source: 'MONA',
          line1: '655 Main Road',
          line2: 'Museum of Old and New Art',
          city: 'Hobart',
          region: 'TAS',
          postalCode: '7009',
          poBox: '',
          country: 'Australia',
        },
      ],
      mobilePhone: auMobilePhone,
      telephone: auTelephone,
    },
    br: {
      countryCode: 'BR',
      countryName: 'Brazil',
      regionLabel: 'State',
      postalLabel: 'CEP',
      names: {
        male: [
          'Miguel', 'Arthur', 'Heitor', 'Theo', 'Davi', 'Gabriel', 'Bernardo', 'Lucas', 'Matheus', 'Pedro',
          'Rafael', 'Enzo', 'Gustavo', 'Felipe', 'Nicolas', 'Daniel', 'Bruno', 'Leonardo', 'Vinicius', 'Rodrigo',
          'Carlos', 'André', 'Ricardo', 'Paulo', 'Marcos', 'Eduardo', 'João', 'Antonio', 'Francisco', 'Diego',
        ],
        female: [
          'Helena', 'Alice', 'Laura', 'Valentina', 'Sophia', 'Isabella', 'Manuela', 'Julia', 'Heloísa', 'Luiza',
          'Maria', 'Ana', 'Beatriz', 'Mariana', 'Lara', 'Gabriela', 'Rafaela', 'Camila', 'Fernanda', 'Carolina',
          'Amanda', 'Bruna', 'Leticia', 'Patricia', 'Natalia', 'Bianca', 'Larissa', 'Daniela', 'Priscila', 'Vanessa',
        ],
        last: [
          'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
          'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
          'Rocha', 'Dias', 'Monteiro', 'Cardoso', 'Reis', 'Araújo', 'Cavalcanti', 'Nunes', 'Mendes', 'Freitas',
        ],
      },
      addresses: [
        {
          source: 'MASP',
          line1: 'Avenida Paulista 1578',
          line2: 'São Paulo Museum of Art',
          city: 'São Paulo',
          region: 'SP',
          postalCode: '01310-200',
          poBox: '',
          country: 'Brazil',
        },
        {
          source: 'Christ the Redeemer',
          line1: 'Parque Nacional da Tijuca',
          line2: 'Alto da Boa Vista',
          city: 'Rio de Janeiro',
          region: 'RJ',
          postalCode: '22241-330',
          poBox: '',
          country: 'Brazil',
        },
        {
          source: 'Congresso Nacional',
          line1: 'Praça dos Três Poderes',
          line2: 'National Congress',
          city: 'Brasília',
          region: 'DF',
          postalCode: '70160-900',
          poBox: '',
          country: 'Brazil',
        },
        {
          source: 'Elevador Lacerda',
          line1: 'Praça Cayru',
          line2: 'Lacerda Elevator',
          city: 'Salvador',
          region: 'BA',
          postalCode: '40026-280',
          poBox: '',
          country: 'Brazil',
        },
        {
          source: 'Praça da Liberdade',
          line1: 'Avenida da Liberdade',
          line2: 'Praça da Liberdade',
          city: 'Belo Horizonte',
          region: 'MG',
          postalCode: '30112-000',
          poBox: '',
          country: 'Brazil',
        },
        {
          source: 'Jardim Botânico de Curitiba',
          line1: 'Rua Engenheiro Ostoja Roguski',
          line2: 'Curitiba Botanical Garden',
          city: 'Curitiba',
          region: 'PR',
          postalCode: '80210-080',
          poBox: '',
          country: 'Brazil',
        },
        {
          source: 'Teatro Amazonas',
          line1: 'Avenida Eduardo Ribeiro',
          line2: 'Amazon Theatre',
          city: 'Manaus',
          region: 'AM',
          postalCode: '69005-000',
          poBox: '',
          country: 'Brazil',
        },
        {
          source: 'Mercado Público de Porto Alegre',
          line1: 'Avenida Sepúlveda',
          line2: 'Porto Alegre Public Market',
          city: 'Porto Alegre',
          region: 'RS',
          postalCode: '90020-130',
          poBox: '',
          country: 'Brazil',
        },
      ],
      mobilePhone: brMobilePhone,
      telephone: brTelephone,
    },
    in: {
      countryCode: 'IN',
      countryName: 'India',
      regionLabel: 'State / UT',
      postalLabel: 'PIN code',
      names: {
        male: [
          'Aarav', 'Vihaan', 'Aditya', 'Arjun', 'Reyansh', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Advik',
          'Rohan', 'Karan', 'Rahul', 'Vikram', 'Siddharth', 'Aniket', 'Dev', 'Kabir', 'Yash', 'Neel',
          'Raj', 'Aryan', 'Manav', 'Harsh', 'Kunal', 'Nikhil', 'Pranav', 'Rishabh', 'Samar', 'Varun',
        ],
        female: [
          'Aadhya', 'Ananya', 'Diya', 'Ira', 'Myra', 'Pari', 'Sara', 'Aanya', 'Kiara', 'Navya',
          'Priya', 'Kavya', 'Ishita', 'Riya', 'Sneha', 'Neha', 'Pooja', 'Anika', 'Meera', 'Shreya',
          'Divya', 'Tanvi', 'Aisha', 'Fatima', 'Zara', 'Nisha', 'Simran', 'Jiya', 'Avni', 'Isha',
        ],
        last: [
          'Sharma', 'Verma', 'Patel', 'Reddy', 'Iyer', 'Nair', 'Singh', 'Kumar', 'Gupta', 'Das',
          'Mehta', 'Joshi', 'Malhotra', 'Kapoor', 'Chopra', 'Agarwal', 'Bansal', 'Shah', 'Desai', 'Rao',
          'Menon', 'Pillai', 'Khan', 'Ansari', 'Hussain', 'Sheikh', 'Bose', 'Mukherjee', 'Banerjee', 'Ghosh',
        ],
      },
      addresses: [
        {
          source: 'Chhatrapati Shivaji Maharaj Terminus',
          line1: 'Dr Dadabhai Naoroji Road',
          line2: 'CSMT',
          city: 'Mumbai',
          region: 'Maharashtra',
          postalCode: '400001',
          poBox: '',
          country: 'India',
        },
        {
          source: 'India Gate',
          line1: 'Rajpath',
          line2: 'India Gate',
          city: 'New Delhi',
          region: 'Delhi',
          postalCode: '110001',
          poBox: '',
          country: 'India',
        },
        {
          source: 'Vidhana Soudha',
          line1: 'Dr Ambedkar Veedhi',
          line2: 'Vidhana Soudha',
          city: 'Bengaluru',
          region: 'Karnataka',
          postalCode: '560001',
          poBox: '',
          country: 'India',
        },
        {
          source: 'Marina Beach',
          line1: 'Marina Beach Road',
          line2: 'Marina Beach',
          city: 'Chennai',
          region: 'Tamil Nadu',
          postalCode: '600004',
          poBox: '',
          country: 'India',
        },
        {
          source: 'Charminar',
          line1: 'Char Kaman',
          line2: 'Charminar',
          city: 'Hyderabad',
          region: 'Telangana',
          postalCode: '500002',
          poBox: '',
          country: 'India',
        },
        {
          source: 'Victoria Memorial',
          line1: 'Queen\'s Way',
          line2: 'Victoria Memorial',
          city: 'Kolkata',
          region: 'West Bengal',
          postalCode: '700071',
          poBox: '',
          country: 'India',
        },
        {
          source: 'Sabarmati Ashram',
          line1: 'Gandhi Smarak Sangrahalaya',
          line2: 'Sabarmati Ashram',
          city: 'Ahmedabad',
          region: 'Gujarat',
          postalCode: '380027',
          poBox: '',
          country: 'India',
        },
        {
          source: 'Amber Fort',
          line1: 'Devisinghpura',
          line2: 'Amer Fort',
          city: 'Jaipur',
          region: 'Rajasthan',
          postalCode: '302028',
          poBox: '',
          country: 'India',
        },
      ],
      mobilePhone: inMobilePhone,
      telephone: inTelephone,
    },
    jp: {
      countryCode: 'JP',
      countryName: 'Japan',
      regionLabel: 'Prefecture',
      postalLabel: 'Postal code',
      names: {
        male: [
          'Haruto', 'Sota', 'Yuto', 'Hinata', 'Ren', 'Minato', 'Riku', 'Yuki', 'Kaito', 'Hayato',
          'Sho', 'Daiki', 'Ryota', 'Kenta', 'Takumi', 'Yuya', 'Shota', 'Kosei', 'Itsuki', 'Ryo',
          'Akira', 'Kenji', 'Taro', 'Hiroshi', 'Satoshi', 'Naoki', 'Kazuki', 'Yamato', 'Taiga', 'Sora',
        ],
        female: [
          'Yui', 'Himari', 'Mei', 'Aoi', 'Ichika', 'Sakura', 'Hana', 'Rin', 'Yuna', 'Mio',
          'Nana', 'Miu', 'Koharu', 'Akari', 'Ayaka', 'Riko', 'Yuzu', 'Momoka', 'Hinako', 'Nene',
          'Emi', 'Yuka', 'Mika', 'Reina', 'Haruka', 'Ayumi', 'Kanako', 'Shiori', 'Misaki', 'Kaori',
        ],
        last: [
          'Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato',
          'Yoshida', 'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Yamazaki',
          'Mori', 'Abe', 'Ikeda', 'Hashimoto', 'Ishikawa', 'Maeda', 'Fujita', 'Okada', 'Goto', 'Hasegawa',
        ],
      },
      addresses: [
        {
          source: 'Tokyo Skytree',
          line1: '1 Chome-1-2 Oshiage',
          line2: 'Tokyo Skytree',
          city: 'Tokyo',
          region: 'Tokyo',
          postalCode: '131-0045',
          poBox: '',
          country: 'Japan',
        },
        {
          source: 'Osaka Castle',
          line1: '1 Osakajo',
          line2: 'Osaka Castle',
          city: 'Osaka',
          region: 'Osaka',
          postalCode: '540-0002',
          poBox: '',
          country: 'Japan',
        },
        {
          source: 'Fushimi Inari Taisha',
          line1: '68 Fukakusa Yabunouchicho',
          line2: 'Fushimi Inari Shrine',
          city: 'Kyoto',
          region: 'Kyoto',
          postalCode: '612-0882',
          poBox: '',
          country: 'Japan',
        },
        {
          source: 'Yokohama Landmark Tower',
          line1: '2 Chome-2-1 Minatomirai',
          line2: 'Landmark Tower',
          city: 'Yokohama',
          region: 'Kanagawa',
          postalCode: '220-0012',
          poBox: '',
          country: 'Japan',
        },
        {
          source: 'Hakata Station',
          line1: 'Hakataeki Chuo-gai',
          line2: 'Hakata Station',
          city: 'Fukuoka',
          region: 'Fukuoka',
          postalCode: '812-0012',
          poBox: '',
          country: 'Japan',
        },
        {
          source: 'Sapporo TV Tower',
          line1: '1 Chome Odorinishi',
          line2: 'Sapporo TV Tower',
          city: 'Sapporo',
          region: 'Hokkaido',
          postalCode: '060-0042',
          poBox: '',
          country: 'Japan',
        },
        {
          source: 'Hiroshima Peace Memorial Park',
          line1: '1 Nakajimacho',
          line2: 'Peace Memorial Park',
          city: 'Hiroshima',
          region: 'Hiroshima',
          postalCode: '730-0811',
          poBox: '',
          country: 'Japan',
        },
        {
          source: 'Kenrokuen Garden',
          line1: '1 Kenrokumachi',
          line2: 'Kenrokuen',
          city: 'Kanazawa',
          region: 'Ishikawa',
          postalCode: '920-0936',
          poBox: '',
          country: 'Japan',
        },
      ],
      mobilePhone: jpMobilePhone,
      telephone: jpTelephone,
    },
    mx: {
      countryCode: 'MX',
      countryName: 'Mexico',
      regionLabel: 'State',
      postalLabel: 'Postal code',
      names: {
        male: [
          'Santiago', 'Mateo', 'Sebastián', 'Leonardo', 'Diego', 'Daniel', 'Emiliano', 'Ángel', 'Miguel', 'Alejandro',
          'José', 'Carlos', 'Luis', 'Fernando', 'Ricardo', 'Javier', 'Andrés', 'Roberto', 'Eduardo', 'Francisco',
          'Pedro', 'Manuel', 'Antonio', 'Jorge', 'Raúl', 'Gabriel', 'Óscar', 'Héctor', 'Rodrigo', 'Pablo',
        ],
        female: [
          'Sofía', 'Valentina', 'Isabella', 'Camila', 'Valeria', 'Mariana', 'Lucía', 'Daniela', 'Regina', 'Fernanda',
          'María', 'Ana', 'Paula', 'Andrea', 'Gabriela', 'Natalia', 'Alejandra', 'Claudia', 'Patricia', 'Laura',
          'Ximena', 'Jimena', 'Paola', 'Diana', 'Adriana', 'Rosa', 'Elena', 'Carmen', 'Teresa', 'Mónica',
        ],
        last: [
          'Hernández', 'García', 'Martínez', 'López', 'González', 'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez', 'Torres',
          'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Jiménez', 'Ruiz', 'Mendoza',
          'Vargas', 'Castillo', 'Ramos', 'Ortiz', 'Chávez', 'Medina', 'Aguilar', 'Contreras', 'Guerrero', 'Castro',
        ],
      },
      addresses: [
        {
          source: 'Palacio de Bellas Artes',
          line1: 'Avenida Juárez',
          line2: 'Palace of Fine Arts',
          city: 'Mexico City',
          region: 'CDMX',
          postalCode: '06050',
          poBox: '',
          country: 'Mexico',
        },
        {
          source: 'Hospicio Cabañas',
          line1: 'Cabañas 8',
          line2: 'Instituto Cultural Cabañas',
          city: 'Guadalajara',
          region: 'Jalisco',
          postalCode: '44360',
          poBox: '',
          country: 'Mexico',
        },
        {
          source: 'Macroplaza',
          line1: 'Zona Centro',
          line2: 'Macroplaza',
          city: 'Monterrey',
          region: 'Nuevo León',
          postalCode: '64000',
          poBox: '',
          country: 'Mexico',
        },
        {
          source: 'Chichen Itzá',
          line1: 'Carretera Mérida-Cancún',
          line2: 'Chichen Itzá',
          city: 'Tinum',
          region: 'Yucatán',
          postalCode: '97757',
          poBox: '',
          country: 'Mexico',
        },
        {
          source: 'Museo Amparo',
          line1: '2 Sur 708',
          line2: 'Amparo Museum',
          city: 'Puebla',
          region: 'Puebla',
          postalCode: '72000',
          poBox: '',
          country: 'Mexico',
        },
        {
          source: 'Malecón de Mazatlán',
          line1: 'Avenida del Mar',
          line2: 'Malecón',
          city: 'Mazatlán',
          region: 'Sinaloa',
          postalCode: '82000',
          poBox: '',
          country: 'Mexico',
        },
        {
          source: 'Museo de Arte Contemporáneo',
          line1: 'Paseo de Montejo',
          line2: 'MACAY',
          city: 'Mérida',
          region: 'Yucatán',
          postalCode: '97000',
          poBox: '',
          country: 'Mexico',
        },
        {
          source: 'Acuario de Veracruz',
          line1: 'Blvd Manuel Ávila Camacho',
          line2: 'Veracruz Aquarium',
          city: 'Veracruz',
          region: 'Veracruz',
          postalCode: '91900',
          poBox: '',
          country: 'Mexico',
        },
      ],
      mobilePhone: mxMobilePhone,
      telephone: mxTelephone,
    },
    nl: {
      countryCode: 'NL',
      countryName: 'Netherlands',
      regionLabel: 'Province',
      postalLabel: 'Postcode',
      names: {
        male: [
          'Daan', 'Sem', 'Lucas', 'Finn', 'Levi', 'Luuk', 'Milan', 'Noah', 'Jesse', 'Max',
          'Liam', 'James', 'Tim', 'Thijs', 'Sven', 'Bram', 'Tom', 'Ruben', 'Julian', 'Stijn',
          'Lars', 'Bas', 'Niels', 'Robin', 'Dennis', 'Kevin', 'Mark', 'Rick', 'Jordy', 'Wouter',
        ],
        female: [
          'Emma', 'Tess', 'Julia', 'Sophie', 'Anna', 'Eva', 'Noa', 'Lotte', 'Mila', 'Sara',
          'Fleur', 'Iris', 'Liv', 'Roos', 'Nora', 'Zoë', 'Elin', 'Maud', 'Lynn', 'Yara',
          'Lisa', 'Laura', 'Kim', 'Naomi', 'Hannah', 'Charlotte', 'Isabel', 'Marieke', 'Anouk', 'Femke',
        ],
        last: [
          'de Jong', 'Jansen', 'de Vries', 'van den Berg', 'van Dijk', 'Bakker', 'Janssen', 'Visser', 'Smit', 'Meijer',
          'de Boer', 'Mulder', 'de Groot', 'Bos', 'Vos', 'Peters', 'Hendriks', 'van Leeuwen', 'Dekker', 'Brouwer',
          'de Wit', 'Dijkstra', 'Smits', 'de Graaf', 'van der Meer', 'Jacobs', 'van der Linden', 'Kok', 'Prins', 'Kuipers',
        ],
      },
      addresses: [
        {
          source: 'Rijksmuseum',
          line1: 'Museumstraat 1',
          line2: 'Rijksmuseum',
          city: 'Amsterdam',
          region: 'North Holland',
          postalCode: '1071 XX',
          poBox: '',
          country: 'Netherlands',
        },
        {
          source: 'Markthal',
          line1: 'Dominee Jan Scharpstraat 298',
          line2: 'Markthal',
          city: 'Rotterdam',
          region: 'South Holland',
          postalCode: '3011 GZ',
          poBox: '',
          country: 'Netherlands',
        },
        {
          source: 'Mauritshuis',
          line1: 'Plein 29',
          line2: 'Mauritshuis',
          city: 'The Hague',
          region: 'South Holland',
          postalCode: '2511 CS',
          poBox: '',
          country: 'Netherlands',
        },
        {
          source: 'Dom Tower',
          line1: 'Domplein',
          line2: 'Utrecht Dom Tower',
          city: 'Utrecht',
          region: 'Utrecht',
          postalCode: '3512 JC',
          poBox: '',
          country: 'Netherlands',
        },
        {
          source: 'Van Abbemuseum',
          line1: 'Stratumsedijk 2',
          line2: 'Van Abbemuseum',
          city: 'Eindhoven',
          region: 'North Brabant',
          postalCode: '5611 ND',
          poBox: '',
          country: 'Netherlands',
        },
        {
          source: 'Groninger Museum',
          line1: 'Museumeiland 1',
          line2: 'Groninger Museum',
          city: 'Groningen',
          region: 'Groningen',
          postalCode: '9712 CV',
          poBox: '',
          country: 'Netherlands',
        },
        {
          source: 'Vrijthof',
          line1: 'Vrijthof',
          line2: 'Maastricht city square',
          city: 'Maastricht',
          region: 'Limburg',
          postalCode: '6211 LE',
          poBox: '',
          country: 'Netherlands',
        },
        {
          source: 'Zaanse Schans',
          line1: 'Schansend 7',
          line2: 'Zaanse Schans',
          city: 'Zaandam',
          region: 'North Holland',
          postalCode: '1508 AD',
          poBox: '',
          country: 'Netherlands',
        },
      ],
      mobilePhone: nlMobilePhone,
      telephone: nlTelephone,
    },
    es: {
      countryCode: 'ES',
      countryName: 'Spain',
      regionLabel: 'Autonomous community',
      postalLabel: 'Postal code',
      names: {
        male: [
          'Hugo', 'Martín', 'Lucas', 'Leo', 'Mateo', 'Daniel', 'Alejandro', 'Pablo', 'Manuel', 'Álvaro',
          'Adrián', 'Mario', 'Diego', 'Javier', 'Carlos', 'Sergio', 'Marc', 'Iván', 'Jorge', 'Raúl',
          'Fernando', 'Rubén', 'Ángel', 'Víctor', 'Gonzalo', 'Bruno', 'Héctor', 'Iker', 'Nicolás', 'Óscar',
        ],
        female: [
          'Lucía', 'Sofía', 'Martina', 'María', 'Paula', 'Emma', 'Daniela', 'Carla', 'Alma', 'Valeria',
          'Noa', 'Julia', 'Laura', 'Elena', 'Claudia', 'Andrea', 'Carmen', 'Ana', 'Marta', 'Sara',
          'Natalia', 'Irene', 'Aitana', 'Laia', 'Marina', 'Blanca', 'Alba', 'Victoria', 'Lola', 'Rocío',
        ],
        last: [
          'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín',
          'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez',
          'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Suárez',
        ],
      },
      addresses: [
        {
          source: 'Museo del Prado',
          line1: 'Paseo del Prado',
          line2: 'Prado Museum',
          city: 'Madrid',
          region: 'Community of Madrid',
          postalCode: '28014',
          poBox: '',
          country: 'Spain',
        },
        {
          source: 'Sagrada Família',
          line1: 'Carrer de Mallorca 401',
          line2: 'Basilica of the Sagrada Família',
          city: 'Barcelona',
          region: 'Catalonia',
          postalCode: '08013',
          poBox: '',
          country: 'Spain',
        },
        {
          source: 'City of Arts and Sciences',
          line1: 'Avinguda del Professor López Piñero',
          line2: 'Ciutat de les Arts i les Ciències',
          city: 'Valencia',
          region: 'Valencian Community',
          postalCode: '46013',
          poBox: '',
          country: 'Spain',
        },
        {
          source: 'Real Alcázar de Sevilla',
          line1: 'Patio de Banderas',
          line2: 'Royal Alcázar',
          city: 'Seville',
          region: 'Andalusia',
          postalCode: '41004',
          poBox: '',
          country: 'Spain',
        },
        {
          source: 'Guggenheim Museum Bilbao',
          line1: 'Abandoibarra Etorbidea 2',
          line2: 'Guggenheim Bilbao',
          city: 'Bilbao',
          region: 'Basque Country',
          postalCode: '48009',
          poBox: '',
          country: 'Spain',
        },
        {
          source: 'Alhambra',
          line1: 'Calle Real de la Alhambra',
          line2: 'Alhambra',
          city: 'Granada',
          region: 'Andalusia',
          postalCode: '18009',
          poBox: '',
          country: 'Spain',
        },
        {
          source: 'Catedral de Santiago de Compostela',
          line1: 'Praza do Obradoiro',
          line2: 'Santiago de Compostela Cathedral',
          city: 'Santiago de Compostela',
          region: 'Galicia',
          postalCode: '15705',
          poBox: '',
          country: 'Spain',
        },
        {
          source: 'Palma Cathedral',
          line1: 'Plaça de la Seu',
          line2: 'La Seu Cathedral',
          city: 'Palma',
          region: 'Balearic Islands',
          postalCode: '07001',
          poBox: '',
          country: 'Spain',
        },
      ],
      mobilePhone: esMobilePhone,
      telephone: esTelephone,
    },
    it: {
      countryCode: 'IT',
      countryName: 'Italy',
      regionLabel: 'Region',
      postalLabel: 'CAP',
      names: {
        male: [
          'Leonardo', 'Francesco', 'Alessandro', 'Lorenzo', 'Mattia', 'Andrea', 'Gabriele', 'Tommaso', 'Riccardo', 'Edoardo',
          'Davide', 'Giuseppe', 'Antonio', 'Marco', 'Luca', 'Giovanni', 'Stefano', 'Paolo', 'Simone', 'Filippo',
          'Matteo', 'Nicola', 'Daniele', 'Federico', 'Christian', 'Manuel', 'Samuele', 'Diego', 'Emanuele', 'Vincenzo',
        ],
        female: [
          'Sofia', 'Giulia', 'Aurora', 'Alice', 'Ginevra', 'Emma', 'Giorgia', 'Beatrice', 'Anna', 'Vittoria',
          'Noemi', 'Ludovica', 'Matilde', 'Francesca', 'Elisa', 'Bianca', 'Chiara', 'Sara', 'Martina', 'Elena',
          'Valentina', 'Alessia', 'Camilla', 'Rebecca', 'Gaia', 'Lucia', 'Irene', 'Nicole', 'Federica', 'Claudia',
        ],
        last: [
          'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco',
          'Bruno', 'Gallo', 'Conti', 'De Luca', 'Costa', 'Fontana', 'Martinelli', 'Serra', 'Caruso', 'Mancini',
          'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Ferretti', 'Martelli', 'Gatti', 'Pellegrini', 'Palumbo', 'Sanna',
        ],
      },
      addresses: [
        {
          source: 'Colosseum',
          line1: 'Piazza del Colosseo 1',
          line2: 'Colosseum',
          city: 'Rome',
          region: 'Lazio',
          postalCode: '00184',
          poBox: '',
          country: 'Italy',
        },
        {
          source: 'Duomo di Milano',
          line1: 'Piazza del Duomo',
          line2: 'Milan Cathedral',
          city: 'Milan',
          region: 'Lombardy',
          postalCode: '20122',
          poBox: '',
          country: 'Italy',
        },
        {
          source: 'Museo Archeologico Nazionale',
          line1: 'Piazza Museo 19',
          line2: 'National Archaeological Museum',
          city: 'Naples',
          region: 'Campania',
          postalCode: '80135',
          poBox: '',
          country: 'Italy',
        },
        {
          source: 'Mole Antonelliana',
          line1: 'Via Montebello 20',
          line2: 'National Cinema Museum',
          city: 'Turin',
          region: 'Piedmont',
          postalCode: '10124',
          poBox: '',
          country: 'Italy',
        },
        {
          source: 'Uffizi Gallery',
          line1: 'Piazzale degli Uffizi 6',
          line2: 'Uffizi Gallery',
          city: 'Florence',
          region: 'Tuscany',
          postalCode: '50122',
          poBox: '',
          country: 'Italy',
        },
        {
          source: 'Piazza San Marco',
          line1: 'Piazza San Marco',
          line2: "St Mark's Square",
          city: 'Venice',
          region: 'Veneto',
          postalCode: '30124',
          poBox: '',
          country: 'Italy',
        },
        {
          source: 'Teatro Massimo',
          line1: 'Piazza Giuseppe Verdi',
          line2: 'Teatro Massimo',
          city: 'Palermo',
          region: 'Sicily',
          postalCode: '90138',
          poBox: '',
          country: 'Italy',
        },
        {
          source: 'Two Towers',
          line1: 'Piazza di Porta Ravegnana',
          line2: 'Due Torri',
          city: 'Bologna',
          region: 'Emilia-Romagna',
          postalCode: '40126',
          poBox: '',
          country: 'Italy',
        },
      ],
      mobilePhone: itMobilePhone,
      telephone: itTelephone,
    },
  };

  const CSV_KEYS = [
    'country_code',
    'country',
    'first_name',
    'last_name',
    'full_name',
    'latin_full_name',
    'email',
    'mobile_phone',
    'telephone',
    'address_line_1',
    'address_line_2',
    'city',
    'region_label',
    'region',
    'postal_label',
    'postal_code',
    'po_box',
    'address_source',
    'address_kind',
    'phone_note',
  ];

  const els = {
    country: document.getElementById('country'),
    gender: document.getElementById('gender'),
    uaeScriptWrap: document.getElementById('uae-script-wrap'),
    uaeScript: document.getElementById('uae-script'),
    seed: document.getElementById('seed'),
    newSeedBtn: document.getElementById('new-seed-btn'),
    useSeedBtn: document.getElementById('use-seed-btn'),
    fields: document.getElementById('fields'),
    status: document.getElementById('status'),
    profileBadge: document.getElementById('profile-badge'),
    fullProfile: document.getElementById('full-profile'),
    jsonOutput: document.getElementById('json-output'),
    csvOutput: document.getElementById('csv-output'),
    copyProfileBtn: document.getElementById('copy-profile-btn'),
    copyJsonBtn: document.getElementById('copy-json-btn'),
    copyCsvBtn: document.getElementById('copy-csv-btn'),
  };

  let currentProfile = null;
  let currentFlatProfile = null;
  let statusTimer = 0;

  function hashString(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index++) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    return function () {
      seed += 0x6D2B79F5;
      let value = seed;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function makeRng() {
    const parts = [els.seed.value.trim(), els.country.value, els.gender.value, els.uaeScript.value];
    return mulberry32(hashString(parts.join('|')));
  }

  function pick(rng, list) {
    return list[Math.floor(rng() * list.length)];
  }

  function randomInt(rng, min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
  }

  function digits(rng, length) {
    let value = '';
    for (let index = 0; index < length; index++) value += String(randomInt(rng, 0, 9));
    return value;
  }

  function padNumber(value, length) {
    return String(value).padStart(length, '0');
  }

  function makeRandomSeed() {
    const values = new Uint32Array(2);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(values);
    } else {
      values[0] = Math.floor(Math.random() * 0xFFFFFFFF);
      values[1] = Date.now() >>> 0;
    }
    return Array.from(values, function (value) {
      return value.toString(36).padStart(7, '0');
    }).join('-');
  }

  function isArabicProfile(profile) {
    return profile.countryCode === 'AE' && profile.nameScript === 'arabic';
  }

  function getNameText(name, script) {
    if (script === 'arabic' && name.arabic) return name.arabic;
    return name.latin || name;
  }

  function slug(value) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 28) || 'test';
  }

  function makeEmail(rng, firstName, lastName) {
    const number = randomInt(rng, 10, 9999);
    return `${slug(firstName)}.${slug(lastName)}${number}@${pick(rng, RESERVED_DOMAINS)}`;
  }

  function uaeMobilePhone(rng) {
    const prefix = pick(rng, ['50', '52', '54', '55', '56', '58']);
    return `+971 ${prefix} ${digits(rng, 3)} ${digits(rng, 4)}`;
  }

  function uaeTelephone(rng, address) {
    const codeByRegion = {
      'Abu Dhabi': '2',
      'Dubai': '4',
      'Sharjah': '6',
      'Ajman': '6',
      'Umm Al Quwain': '6',
      'Ras Al Khaimah': '7',
      'Fujairah': '9',
      'Al Ain': '3',
    };
    const areaCode = codeByRegion[address.region] || '4';
    return `+971 ${areaCode} ${randomInt(rng, 200, 899)} ${digits(rng, 4)}`;
  }

  function usAreaCode(address) {
    if (address.city === 'San Francisco') return '415';
    if (address.city === 'Los Angeles') return '213';
    const areaCodes = {
      NY: '212',
      WA: '206',
      IL: '312',
      CA: '310',
      MA: '617',
      DC: '202',
      CO: '303',
      PA: '215',
      AZ: '602',
      NV: '702',
      OR: '503',
      OH: '216',
      MI: '313',
      TN: '615',
      NC: '704',
      WI: '414',
      MO: '314',
      TX: '512',
      FL: '305',
      GA: '404',
    };
    return areaCodes[address.region] || '212';
  }

  function usPhone(rng, address) {
    return `+1 (${usAreaCode(address)}) 555-01${padNumber(randomInt(rng, 0, 99), 2)}`;
  }

  function ukMobilePhone(rng) {
    return `+44 7700 900${padNumber(randomInt(rng, 0, 999), 3)}`;
  }

  function ukTelephone(rng, address) {
    const byCity = {
      Manchester: '+44 161 496 ',
      Edinburgh: '+44 131 496 ',
      Birmingham: '+44 121 496 ',
      Liverpool: '+44 151 496 ',
      Leeds: '+44 113 496 ',
      Glasgow: '+44 141 496 ',
      Cardiff: '+44 29 2018 ',
      Bristol: '+44 117 496 ',
      Oxford: '+44 1865 496 ',
      Cambridge: '+44 1223 496 ',
      Exeter: '+44 1392 496 ',
      Belfast: '+44 28 9018 ',
    };
    const prefix = byCity[address.city];
    if (prefix) return `${prefix}${padNumber(randomInt(rng, 0, 9999), 4)}`;
    return `+44 20 7946 ${padNumber(randomInt(rng, 0, 999), 3)}`;
  }

  function sgMobilePhone(rng) {
    return `+65 ${pick(rng, ['8', '9'])}${digits(rng, 3)} ${digits(rng, 4)}`;
  }

  function sgTelephone(rng) {
    return `+65 6${digits(rng, 3)} ${digits(rng, 4)}`;
  }

  function caAreaCode(address) {
    const map = { ON: '416', BC: '604', QC: '514', AB: '403', MB: '204', NS: '902', SK: '306' };
    return map[address.region] || '416';
  }

  function caPhone(rng, address) {
    return `+1 (${caAreaCode(address)}) 555-01${padNumber(randomInt(rng, 0, 99), 2)}`;
  }

  function deMobilePhone(rng) {
    return `+49 ${pick(rng, ['151', '157', '160', '170', '175', '176', '177', '178', '179'])} ${digits(rng, 7)}`;
  }

  function deTelephone(rng) {
    return `+49 ${pick(rng, ['30', '40', '69', '89', '221', '211'])} ${digits(rng, 7)}`;
  }

  function frMobilePhone(rng) {
    return `+33 ${pick(rng, ['6', '7'])} ${digits(rng, 2)} ${digits(rng, 2)} ${digits(rng, 2)} ${digits(rng, 2)}`;
  }

  function frTelephone(rng, address) {
    if (address.city === 'Paris') return `+33 1 ${digits(rng, 2)} ${digits(rng, 2)} ${digits(rng, 2)} ${digits(rng, 2)}`;
    return `+33 ${pick(rng, ['4', '5'])} ${digits(rng, 2)} ${digits(rng, 2)} ${digits(rng, 2)} ${digits(rng, 2)}`;
  }

  function auMobilePhone(rng) {
    return `+61 ${pick(rng, ['400', '401', '402', '403', '404', '405', '406', '407', '408', '409'])} ${digits(rng, 3)} ${digits(rng, 3)}`;
  }

  function auTelephone(rng) {
    return `+61 ${pick(rng, ['2', '3', '7', '8'])} ${digits(rng, 4)} ${digits(rng, 4)}`;
  }

  function brMobilePhone(rng) {
    const ddd = pick(rng, ['11', '21', '31', '41', '51', '61', '71', '81', '85']);
    return `+55 ${ddd} 9${digits(rng, 4)}-${digits(rng, 4)}`;
  }

  function brTelephone(rng) {
    const ddd = pick(rng, ['11', '21', '31', '41']);
    return `+55 ${ddd} ${digits(rng, 4)}-${digits(rng, 4)}`;
  }

  function inMobilePhone(rng) {
    return `+91 ${pick(rng, ['6', '7', '8', '9'])}${digits(rng, 4)} ${digits(rng, 5)}`;
  }

  function inTelephone(rng) {
    return `+91 ${pick(rng, ['11', '22', '33', '40', '80'])} ${digits(rng, 4)} ${digits(rng, 4)}`;
  }

  function jpMobilePhone(rng) {
    return `+81 ${pick(rng, ['70', '80', '90'])}-${digits(rng, 4)}-${digits(rng, 4)}`;
  }

  function jpTelephone(rng, address) {
    const byCity = {
      Tokyo: '3',
      Osaka: '6',
      Kyoto: '75',
      Yokohama: '45',
      Fukuoka: '92',
      Sapporo: '11',
      Hiroshima: '82',
      Kanazawa: '76',
    };
    const ac = byCity[address.city] || '3';
    return `+81 ${ac}-${digits(rng, 4)}-${digits(rng, 4)}`;
  }

  function mxMobilePhone(rng) {
    return `+52 ${pick(rng, ['55', '33', '81'])} ${digits(rng, 4)} ${digits(rng, 4)}`;
  }

  function mxTelephone(rng) {
    return `+52 ${pick(rng, ['55', '33'])} ${digits(rng, 4)} ${digits(rng, 4)}`;
  }

  function nlMobilePhone(rng) {
    return `+31 6${digits(rng, 8)}`;
  }

  function nlTelephone(rng) {
    return `+31 ${pick(rng, ['20', '10', '30', '40', '50'])} ${digits(rng, 3)} ${digits(rng, 4)}`;
  }

  function esMobilePhone(rng) {
    return `+34 ${pick(rng, ['6', '7'])}${digits(rng, 2)} ${digits(rng, 3)} ${digits(rng, 3)}`;
  }

  function esTelephone(rng) {
    return `+34 ${pick(rng, ['91', '93', '95'])} ${digits(rng, 3)} ${digits(rng, 4)}`;
  }

  function itMobilePhone(rng) {
    return `+39 ${pick(rng, ['320', '330', '340', '350', '360', '370', '380', '390'])} ${digits(rng, 3)} ${digits(rng, 4)}`;
  }

  function itTelephone(rng) {
    return `+39 ${pick(rng, ['02', '06', '051', '011'])} ${digits(rng, 4)} ${digits(rng, 4)}`;
  }

  function cityLine(profile) {
    const address = profile.address;
    if (profile.countryCode === 'SG') return `${address.city} ${address.postalCode}`;
    if (profile.countryCode === 'GB') return `${address.city}, ${address.postalCode}`;
    if (profile.countryCode === 'US') return `${address.city}, ${address.region} ${address.postalCode}`;
    return `${address.city}, ${address.region} ${address.postalCode}`;
  }

  function formatAddress(profile) {
    const address = profile.address;
    return [
      address.line1,
      address.line2,
      address.poBox,
      cityLine(profile),
      address.country,
    ].filter(Boolean).join('\n');
  }

  function makeProfile() {
    if (!els.seed.value.trim()) els.seed.value = makeRandomSeed();

    const config = COUNTRY_PROFILES[els.country.value];
    const rng = makeRng();
    const resolvedGender = els.gender.value === 'any' ? pick(rng, ['female', 'male']) : els.gender.value;
    const nameScript = config.countryCode === 'AE' ? els.uaeScript.value : 'latin';
    const first = pick(rng, config.names[resolvedGender]);
    const last = pick(rng, config.names.last);
    const address = pick(rng, config.addresses);
    const latinFirst = first.latin || first;
    const latinLast = last.latin || last;
    const firstName = getNameText(first, nameScript);
    const lastName = getNameText(last, nameScript);
    const fullName = `${firstName} ${lastName}`;
    const latinFullName = `${latinFirst} ${latinLast}`;

    return {
      countryCode: config.countryCode,
      countryName: config.countryName,
      regionLabel: config.regionLabel,
      postalLabel: config.postalLabel,
      gender: resolvedGender,
      nameScript,
      firstName,
      lastName,
      fullName,
      latinFirstName: latinFirst,
      latinLastName: latinLast,
      latinFullName,
      email: makeEmail(rng, latinFirst, latinLast),
      mobilePhone: config.mobilePhone(rng, address),
      telephone: config.telephone(rng, address),
      address: Object.assign({}, address),
      addressKind: ADDRESS_KIND,
      phoneNote: PHONE_NOTE,
    };
  }

  function flattenProfile(profile) {
    return {
      country_code: profile.countryCode,
      country: profile.address.country,
      first_name: profile.firstName,
      last_name: profile.lastName,
      full_name: profile.fullName,
      latin_full_name: profile.fullName === profile.latinFullName ? '' : profile.latinFullName,
      email: profile.email,
      mobile_phone: profile.mobilePhone,
      telephone: profile.telephone,
      address_line_1: profile.address.line1,
      address_line_2: profile.address.line2,
      city: profile.address.city,
      region_label: profile.regionLabel,
      region: profile.address.region,
      postal_label: profile.postalLabel,
      postal_code: profile.address.postalCode,
      po_box: profile.address.poBox,
      address_source: profile.address.source,
      address_kind: profile.addressKind,
      phone_note: profile.phoneNote,
    };
  }

  function profileForJson(profile) {
    return {
      countryCode: profile.countryCode,
      country: profile.countryName,
      name: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: profile.fullName,
        latinFirstName: profile.latinFirstName,
        latinLastName: profile.latinLastName,
        latinFullName: profile.latinFullName,
        gender: profile.gender,
        script: profile.nameScript,
      },
      contact: {
        email: profile.email,
        mobilePhone: profile.mobilePhone,
        telephone: profile.telephone,
      },
      address: {
        line1: profile.address.line1,
        line2: profile.address.line2,
        city: profile.address.city,
        regionLabel: profile.regionLabel,
        region: profile.address.region,
        postalLabel: profile.postalLabel,
        postalCode: profile.address.postalCode,
        poBox: profile.address.poBox,
        country: profile.address.country,
        formatted: formatAddress(profile),
        source: profile.address.source,
      },
      metadata: {
        addressKind: profile.addressKind,
        phoneNote: profile.phoneNote,
        seed: els.seed.value.trim(),
      },
    };
  }

  function csvEscape(value) {
    const text = value == null ? '' : String(value);
    if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  }

  function profileToCsv(flatProfile) {
    return [
      CSV_KEYS.join(','),
      CSV_KEYS.map(function (key) { return csvEscape(flatProfile[key]); }).join(','),
    ].join('\n');
  }

  function profileToText(profile) {
    const lines = [
      `Name: ${profile.fullName}`,
    ];

    if (profile.fullName !== profile.latinFullName) lines.push(`Latin name: ${profile.latinFullName}`);

    lines.push(
      `Email: ${profile.email}`,
      `Mobile phone: ${profile.mobilePhone}`,
      `Telephone: ${profile.telephone}`,
      'Address:',
      formatAddress(profile).split('\n').map(function (line) { return `  ${line}`; }).join('\n'),
      `Address source: ${profile.address.source}`,
      `Address kind: ${profile.addressKind}`,
      `Phone note: ${profile.phoneNote}`
    );

    return lines.join('\n');
  }

  function fieldDefinitions(profile) {
    const rtl = isArabicProfile(profile) ? 'rtl' : 'ltr';
    const fields = [
      { label: 'First name', value: profile.firstName, dir: rtl },
      { label: 'Last name', value: profile.lastName, dir: rtl },
      { label: 'Full name', value: profile.fullName, dir: rtl },
    ];

    if (profile.fullName !== profile.latinFullName) {
      fields.push({ label: 'Latin full name', value: profile.latinFullName, dir: 'ltr' });
    }

    fields.push(
      { label: 'Email', value: profile.email, dir: 'ltr' },
      { label: 'Mobile phone', value: profile.mobilePhone, dir: 'ltr' },
      { label: 'Telephone', value: profile.telephone, dir: 'ltr' },
      { label: 'Address line 1', value: profile.address.line1, dir: 'ltr' },
      { label: 'Address line 2', value: profile.address.line2, dir: 'ltr' },
      { label: 'City', value: profile.address.city, dir: 'ltr' },
      { label: profile.regionLabel, value: profile.address.region, dir: 'ltr' },
      { label: profile.postalLabel, value: profile.address.postalCode, dir: 'ltr' }
    );

    if (profile.address.poBox) fields.push({ label: 'P.O. Box', value: profile.address.poBox, dir: 'ltr' });

    fields.push(
      { label: 'Country', value: profile.address.country, dir: 'ltr' },
      { label: 'Address source', value: profile.address.source, dir: 'ltr', wide: true }
    );

    return fields;
  }

  function renderFields(profile) {
    els.fields.textContent = '';

    fieldDefinitions(profile).forEach(function (field) {
      const wrapper = document.createElement('div');
      wrapper.className = `field-box${field.wide ? ' wide' : ''}`;

      const top = document.createElement('div');
      top.className = 'field-top';

      const label = document.createElement('span');
      label.className = 'field-label';
      label.textContent = field.label;

      const copyButton = document.createElement('button');
      copyButton.className = 'secondary field-copy';
      copyButton.type = 'button';
      copyButton.textContent = 'Copy';
      copyButton.addEventListener('click', function () {
        copyText(field.value, `${field.label} copied.`);
      });

      const value = document.createElement('div');
      value.className = 'field-value';
      value.dir = field.dir || 'ltr';
      value.textContent = field.value || 'N/A';

      top.append(label, copyButton);
      wrapper.append(top, value);
      els.fields.appendChild(wrapper);
    });
  }

  function renderProfile(profile) {
    currentProfile = profile;
    currentFlatProfile = flattenProfile(profile);

    renderFields(profile);
    els.profileBadge.textContent = `${profile.countryCode} public test address`;
    els.fullProfile.value = profileToText(profile);
    els.jsonOutput.value = JSON.stringify(profileForJson(profile), null, 2);
    els.csvOutput.value = profileToCsv(currentFlatProfile);
  }

  function generateAndRender(message) {
    updateCountryControls();
    renderProfile(makeProfile());
    if (message) flash(message);
  }

  function updateCountryControls() {
    const isUae = els.country.value === 'ae';
    els.uaeScriptWrap.hidden = !isUae;
    els.uaeScript.disabled = !isUae;
  }

  function flash(message, isError) {
    window.clearTimeout(statusTimer);
    els.status.textContent = message;
    els.status.className = isError ? 'error status-line' : 'muted status-line';
    statusTimer = window.setTimeout(function () {
      if (els.status.textContent === message) els.status.textContent = '';
    }, 2200);
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    let copied = false;
    try {
      copied = document.execCommand('copy');
    } finally {
      textarea.remove();
    }
    if (!copied) throw new Error('copy failed');
  }

  async function copyText(text, message) {
    if (!text) {
      flash('Nothing to copy.', true);
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopy(text);
      }
      flash(message || 'Copied.');
    } catch {
      flash('Copy failed. Select the text and copy manually.', true);
    }
  }

  els.country.addEventListener('change', function () {
    generateAndRender('Country updated.');
  });

  els.gender.addEventListener('change', function () {
    generateAndRender('Name style updated.');
  });

  els.uaeScript.addEventListener('change', function () {
    generateAndRender('UAE name display updated.');
  });

  els.newSeedBtn.addEventListener('click', function () {
    els.seed.value = makeRandomSeed();
    generateAndRender('New profile generated.');
  });

  els.useSeedBtn.addEventListener('click', function () {
    generateAndRender('Seed applied.');
  });

  els.seed.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') generateAndRender('Seed applied.');
  });

  els.copyProfileBtn.addEventListener('click', function () {
    copyText(els.fullProfile.value, 'Profile copied.');
  });

  els.copyJsonBtn.addEventListener('click', function () {
    copyText(els.jsonOutput.value, 'JSON copied.');
  });

  els.copyCsvBtn.addEventListener('click', function () {
    copyText(els.csvOutput.value, 'CSV copied.');
  });

  els.seed.value = makeRandomSeed();
  generateAndRender();
}());
