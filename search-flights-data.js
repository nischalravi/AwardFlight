// ============================================
// FLIGHT DATA WITH AWARD MILES & CREDIT CARDS
// ============================================

const flightDatabase = [
    {
        id: 1,
        airline: 'Air France',
        code: 'AF 685',
        aircraft: 'Boeing 777-300ER',
        logo: '✈',
        logoColor: 'linear-gradient(135deg, #e74c3c, #c0392b)',
        price: 1250,
        departTime: '6:30 PM',
        arriveTime: '8:15 AM+1',
        departAirport: 'JFK - New York',
        arriveAirport: 'MXP - Milan',
        duration: '8h 45m',
        stops: 0,
        stopInfo: 'Non-stop',
        legroom: 'Average legroom (31")',
        entertainment: true,
        meal: 'Meal included',
        departTimeCategory: 'evening',
        // Award miles information
        awardMiles: {
            program: 'Flying Blue',
            businessClass: 55000,
            economyClass: 25000,
            firstClass: 90000
        },
        transferPartners: [
            { name: 'Amex MR', ratio: '1:1', class: 'amex' },
            { name: 'Chase UR', ratio: '1:1', class: 'chase' },
            { name: 'Citi TYP', ratio: '1:1', class: 'citi' },
            { name: 'Capital One', ratio: '1:1', class: 'capital-one' }
        ]
    },
    {
        id: 2,
        airline: 'British Airways',
        code: 'BA 112',
        aircraft: 'Airbus A350-1000',
        logo: '✈',
        logoColor: 'linear-gradient(135deg, #3498db, #2980b9)',
        price: 1180,
        departTime: '9:20 AM',
        arriveTime: '10:45 PM',
        departAirport: 'JFK - New York',
        arriveAirport: 'MXP - Milan',
        duration: '13h 25m',
        stops: 1,
        stopInfo: '1 stop in LHR',
        legroom: 'Above average legroom (34")',
        entertainment: true,
        meal: 'Meal included',
        departTimeCategory: 'morning',
        awardMiles: {
            program: 'Avios',
            businessClass: 68000,
            economyClass: 26000,
            firstClass: 102000
        },
        transferPartners: [
            { name: 'Amex MR', ratio: '1:1', class: 'amex' },
            { name: 'Chase UR', ratio: '1:1', class: 'chase' },
            { name: 'Citi TYP', ratio: '1:1', class: 'citi' },
            { name: 'Marriott', ratio: '3:1', class: 'marriott' }
        ]
    },
    {
        id: 3,
        airline: 'Lufthansa',
        code: 'LH 405',
        aircraft: 'Boeing 747-8',
        logo: '✈',
        logoColor: 'linear-gradient(135deg, #f39c12, #e67e22)',
        price: 1320,
        departTime: '2:15 PM',
        arriveTime: '11:45 PM',
        departAirport: 'JFK - New York',
        arriveAirport: 'MXP - Milan',
        duration: '9h 30m',
        stops: 0,
        stopInfo: 'Non-stop',
        legroom: 'Average legroom (32")',
        entertainment: true,
        meal: '2 meals included',
        departTimeCategory: 'afternoon',
        awardMiles: {
            program: 'Miles & More',
            businessClass: 70000,
            economyClass: 30000,
            firstClass: 110000
        },
        transferPartners: [
            { name: 'Amex MR', ratio: '1:1', class: 'amex' },
            { name: 'Chase UR', ratio: '1:1', class: 'chase' },
            { name: 'Citi TYP', ratio: '1:1', class: 'citi' },
            { name: 'Capital One', ratio: '1:1', class: 'capital-one' }
        ]
    },
    {
        id: 4,
        airline: 'Emirates',
        code: 'EK 201',
        aircraft: 'Airbus A380',
        logo: '✈',
        logoColor: 'linear-gradient(135deg, #c0392b, #e74c3c)',
        price: 1580,
        departTime: '11:30 PM',
        arriveTime: '5:45 PM+1',
        departAirport: 'JFK - New York',
        arriveAirport: 'MXP - Milan',
        duration: '16h 15m',
        stops: 2,
        stopInfo: '2 stops in DXB, FCO',
        legroom: 'Extra legroom (36")',
        entertainment: true,
        meal: '3 meals included',
        departTimeCategory: 'evening',
        awardMiles: {
            program: 'Skywards',
            businessClass: 85000,
            economyClass: 40000,
            firstClass: 180000
        },
        transferPartners: [
            { name: 'Amex MR', ratio: '1:1', class: 'amex' },
            { name: 'Marriott', ratio: '3:1', class: 'marriott' }
        ]
    },
    {
        id: 5,
        airline: 'Air France',
        code: 'AF 332',
        aircraft: 'Boeing 787-9',
        logo: '✈',
        logoColor: 'linear-gradient(135deg, #e74c3c, #c0392b)',
        price: 1095,
        departTime: '7:45 AM',
        arriveTime: '9:30 PM',
        departAirport: 'JFK - New York',
        arriveAirport: 'MXP - Milan',
        duration: '11h 45m',
        stops: 1,
        stopInfo: '1 stop in CDG',
        legroom: 'Average legroom (31")',
        entertainment: true,
        meal: 'Meal included',
        departTimeCategory: 'morning',
        awardMiles: {
            program: 'Flying Blue',
            businessClass: 50000,
            economyClass: 22000,
            firstClass: 85000
        },
        transferPartners: [
            { name: 'Amex MR', ratio: '1:1', class: 'amex' },
            { name: 'Chase UR', ratio: '1:1', class: 'chase' },
            { name: 'Citi TYP', ratio: '1:1', class: 'citi' },
            { name: 'Capital One', ratio: '1:1', class: 'capital-one' }
        ]
    },
    {
        id: 6,
        airline: 'British Airways',
        code: 'BA 178',
        aircraft: 'Boeing 777-200',
        logo: '✈',
        logoColor: 'linear-gradient(135deg, #3498db, #2980b9)',
        price: 1445,
        departTime: '3:40 PM',
        arriveTime: '6:25 AM+1',
        departAirport: 'JFK - New York',
        arriveAirport: 'MXP - Milan',
        duration: '12h 45m',
        stops: 1,
        stopInfo: '1 stop in LHR',
        legroom: 'Above average legroom (34")',
        entertainment: true,
        meal: '2 meals included',
        departTimeCategory: 'afternoon',
        awardMiles: {
            program: 'Avios',
            businessClass: 75000,
            economyClass: 30000,
            firstClass: 112000
        },
        transferPartners: [
            { name: 'Amex MR', ratio: '1:1', class: 'amex' },
            { name: 'Chase UR', ratio: '1:1', class: 'chase' },
            { name: 'Citi TYP', ratio: '1:1', class: 'citi' }
        ]
    },
    {
        id: 7,
        airline: 'Lufthansa',
        code: 'LH 988',
        aircraft: 'Airbus A340-600',
        logo: '✈',
        logoColor: 'linear-gradient(135deg, #f39c12, #e67e22)',
        price: 1290,
        departTime: '10:15 AM',
        arriveTime: '12:30 AM+1',
        departAirport: 'JFK - New York',
        arriveAirport: 'MXP - Milan',
        duration: '14h 15m',
        stops: 1,
        stopInfo: '1 stop in FRA',
        legroom: 'Average legroom (32")',
        entertainment: true,
        meal: 'Meal included',
        departTimeCategory: 'morning',
        awardMiles: {
            program: 'Miles & More',
            businessClass: 62000,
            economyClass: 28000,
            firstClass: 95000
        },
        transferPartners: [
            { name: 'Amex MR', ratio: '1:1', class: 'amex' },
            { name: 'Chase UR', ratio: '1:1', class: 'chase' },
            { name: 'Capital One', ratio: '1:1', class: 'capital-one' }
        ]
    }
];

// Export to window for global access
window.flightDatabase = flightDatabase;

// Export to window
window.flightDatabase = flightDatabase;
console.log('✅ Loaded', flightDatabase.length, 'flights');
