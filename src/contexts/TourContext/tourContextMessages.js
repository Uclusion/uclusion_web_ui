import { registerListener } from '../../utils/MessageBusUtils'
import { startTour } from './tourContextReducer'

export const TOUR_CHANNEL = 'TourChannel';
export const START_TOUR = 'StartTour';

function beginListening(dispatch) {
  registerListener(TOUR_CHANNEL, 'tourChannelStart', (data) => {
    const { payload: { event, tour } } = data;
    switch (event) {
      case START_TOUR:
        dispatch(startTour(tour));
        break;
      default:
      // console.debug(`Ignoring identity event ${event}`);
    }
  });
}

export default beginListening;