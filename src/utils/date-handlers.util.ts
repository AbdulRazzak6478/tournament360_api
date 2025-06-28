

const OneMinuteFromNow = ()=> new Date(Date.now() + ( 1000 * 60 ));

const fifteenMinutesFromNow = () => new Date(Date.now() + (1000 * 60 * 15)); 

const thirtyDaysFromNow = ()=> new Date(Date.now() + (1000 * 60 * 60 * 24 * 30 ));

export {
    OneMinuteFromNow,
    fifteenMinutesFromNow,
    thirtyDaysFromNow
}