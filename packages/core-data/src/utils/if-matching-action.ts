interface Action extends Record< string, any > {
	type: string;
}

/**
 * A higher-order reducer creator which invokes the original reducer only if
 * the dispatching action matches the given predicate, **OR** if state is
 * initializing (undefined).
 *
 * @param isMatch Function predicate for allowing reducer call.
 * @return        Higher-order reducer.
 */
const ifMatchingAction = <
	Matcher extends ( action: Action ) => boolean,
	State,
	Reducer extends ( state: State, action: Action ) => State
>(
	isMatch: Matcher
) => ( reducer: Reducer ) =>
	( ( state, action ) => {
		if ( state === undefined || isMatch( action ) ) {
			return reducer( state, action );
		}

		return state;
	} ) as Reducer;

export default ifMatchingAction;
