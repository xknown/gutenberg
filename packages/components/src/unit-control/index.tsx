/**
 * External dependencies
 */
import type {
	KeyboardEvent,
	ForwardedRef,
	ChangeEvent,
	MutableRefObject,
} from 'react';
import { noop, omit } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef, useMemo, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../ui/context';
import { Root, ValueInput } from './styles/unit-control-styles';
import UnitSelectControl from './unit-select-control';
import {
	CSS_UNITS,
	getParsedQuantityAndUnit,
	getUnitsWithCurrentUnit,
	getValidParsedQuantityAndUnit,
} from './utils';
import { useControlledState } from '../utils/hooks';
import type { UnitControlProps, UnitControlOnChangeCallback } from './types';

function UnitControl(
	{
		__unstableStateReducer: stateReducer = ( state ) => state,
		autoComplete = 'off',
		className,
		disabled = false,
		disableUnits = false,
		isPressEnterToChange = false,
		isResetValueOnUnitChange = false,
		isUnitSelectTabbable = true,
		label,
		onChange = noop,
		onUnitChange = noop,
		size = 'default',
		style,
		unit: unitProp,
		units: unitsProp = CSS_UNITS,
		value: valueProp,
		...props
	}: WordPressComponentProps< UnitControlProps, 'input', false >,
	forwardedRef: ForwardedRef< any >
) {
	// The `value` prop, in theory, should not be `null`, but the following line
	// ensures it fallback to `undefined` in case a consumer of `UnitControl`
	// still passes `null` as a `value`.
	const nonNullValueProp = valueProp ?? undefined;
	const [ units, reFirstCharacterOfUnits ] = useMemo( () => {
		const list = getUnitsWithCurrentUnit(
			nonNullValueProp,
			unitProp,
			unitsProp
		);
		const firstCharacters = list.reduce( ( carry, { value } ) => {
			const first = value.substr( 0, 1 );
			return carry.includes( first ) ? carry : `${ carry }|${ first }`;
		}, list[ 0 ]?.value.substr( 0, 1 ) );
		return [ list, new RegExp( `^(?:${ firstCharacters })$` ) ];
	}, [ nonNullValueProp, unitProp, unitsProp ] );
	const [ parsedQuantity, parsedUnit ] = getParsedQuantityAndUnit(
		nonNullValueProp,
		unitProp,
		units
	);

	const [ unit, setUnit ] = useControlledState< string | undefined >(
		unitProp,
		{
			initial: parsedUnit,
			fallback: '',
		}
	);

	useEffect( () => {
		setUnit( parsedUnit );
	}, [ parsedUnit ] );

	const classes = classnames( 'components-unit-control', className );

	const handleOnQuantityChange = (
		nextQuantityValue: number | string | undefined,
		changeProps: { event: ChangeEvent< HTMLInputElement > }
	) => {
		if (
			nextQuantityValue === '' ||
			typeof nextQuantityValue === 'undefined' ||
			nextQuantityValue === null
		) {
			onChange( '', changeProps );
			return;
		}

		/*
		 * Customizing the onChange callback.
		 * This allows as to broadcast a combined value+unit to onChange.
		 */
		const onChangeValue = getValidParsedQuantityAndUnit(
			nextQuantityValue,
			units,
			parsedQuantity,
			unit
		).join( '' );

		onChange( onChangeValue, changeProps );
	};

	const handleOnUnitChange: UnitControlOnChangeCallback = (
		nextUnitValue,
		changeProps
	) => {
		const { data } = changeProps;

		let nextValue = `${ parsedQuantity ?? '' }${ nextUnitValue }`;

		if ( isResetValueOnUnitChange && data?.default !== undefined ) {
			nextValue = `${ data.default }${ nextUnitValue }`;
		}

		onChange( nextValue, changeProps );
		onUnitChange( nextUnitValue, changeProps );

		setUnit( nextUnitValue );
	};

	let handleOnKeyDown;
	if ( ! disableUnits && isUnitSelectTabbable && units.length ) {
		handleOnKeyDown = ( event: KeyboardEvent< HTMLInputElement > ) => {
			props.onKeyDown?.( event );
			// Does the key match the first character of any units?
			if ( reFirstCharacterOfUnits.test( event.key ) ) {
				// moves focus to the UnitSelectControl
				refInputSuffix.current?.focus();
			}
		};
	}

	const refInputSuffix: MutableRefObject<
		HTMLSelectElement | undefined
	> = useRef();
	const inputSuffix = ! disableUnits ? (
		<UnitSelectControl
			ref={ refInputSuffix }
			aria-label={ __( 'Select unit' ) }
			disabled={ disabled }
			isUnitSelectTabbable={ isUnitSelectTabbable }
			onChange={ handleOnUnitChange }
			size={ size }
			unit={ unit }
			units={ units }
		/>
	) : null;

	let step = props.step;

	/*
	 * If no step prop has been passed, lookup the active unit and
	 * try to get step from `units`, or default to a value of `1`
	 */
	if ( ! step && units ) {
		const activeUnit = units.find( ( option ) => option.value === unit );
		step = activeUnit?.step ?? 1;
	}

	return (
		<Root className="components-unit-control-wrapper" style={ style }>
			<ValueInput
				aria-label={ label }
				{ ...omit( props, [ 'children' ] ) }
				autoComplete={ autoComplete }
				className={ classes }
				disabled={ disabled }
				disableUnits={ disableUnits }
				isPressEnterToChange={ isPressEnterToChange }
				label={ label }
				onKeyDown={ handleOnKeyDown }
				onChange={ handleOnQuantityChange }
				ref={ forwardedRef }
				size={ size }
				suffix={ inputSuffix }
				value={ parsedQuantity ?? '' }
				step={ step }
			/>
		</Root>
	);
}

/**
 * `UnitControl` allows the user to set a value as well as a unit (e.g. `px`).
 *
 *
 * @example
 * ```jsx
 * import { __experimentalUnitControl as UnitControl } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const Example = () => {
 *   const [ value, setValue ] = useState( '10px' );
 *
 *   return <UnitControl onChange={ setValue } value={ value } />;
 * };
 * ```
 */
const ForwardedUnitControl = forwardRef( UnitControl );

export { parseQuantityAndUnitFromRawValue, useCustomUnits } from './utils';
export default ForwardedUnitControl;
