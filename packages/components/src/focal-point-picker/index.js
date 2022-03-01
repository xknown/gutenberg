/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import {
	__experimentalUseDragging as useDragging,
	useInstanceId,
} from '@wordpress/compose';
import { UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import Controls from './controls';
import FocalPoint from './focal-point';
import Grid from './grid';
import Media from './media';
import {
	MediaWrapper,
	MediaContainer,
} from './styles/focal-point-picker-style';
import { INITIAL_BOUNDS } from './utils';

export default function FocalPointPicker( {
	autoPlay = true,
	className,
	help,
	label,
	onChange,
	onDrag,
	onDragEnd,
	onDragStart,
	resolvePoint,
	url,
	value: valueProp = {
		x: 0.5,
		y: 0.5,
	},
} ) {
	const [ point, setPoint ] = useState( valueProp );
	const isPointSent = useRef( true );
	const { current: keepPoint } = useRef( ( value ) => {
		setPoint( value );
		isPointSent.current = false;
	} );
	const sendPoint = ( value = point ) => {
		onChange?.( value );
		isPointSent.current = true;
	};
	const { x, y } = isPointSent.current ? valueProp : point;

	const dragAreaRef = useRef();
	const [ bounds, setBounds ] = useState( INITIAL_BOUNDS );
	const { current: updateBounds } = useRef( () => {
		const {
			clientWidth: width,
			clientHeight: height,
		} = dragAreaRef.current;
		// Styling gives the drag area dimensions even when the media has not
		// loaded so the fallback to initial bounds is a testing affordance.
		setBounds(
			width > 0 && height > 0 ? { width, height } : { ...INITIAL_BOUNDS }
		);
	} );

	useEffect( () => {
		const { defaultView } = dragAreaRef.current.ownerDocument;
		defaultView.addEventListener( 'resize', updateBounds );
		return () => {
			defaultView.removeEventListener( 'resize', updateBounds );
		};
	}, [] );

	const { startDrag, endDrag, isDragging } = useDragging( {
		onDragStart: ( event ) => {
			dragAreaRef.current.focus();
			const value = getValueWithinDragArea( event );
			onDragStart?.( value, event );
			keepPoint( value );
		},
		onDragMove: ( event ) => {
			// Prevents text-selection when dragging.
			event.preventDefault();
			const value = getValueWithinDragArea( event );
			onDrag?.( value, event );
			keepPoint( value );
		},
		onDragEnd: ( event ) => {
			onDragEnd?.( event );
		},
	} );

	useEffect( () => {
		if ( ! isDragging && ! isPointSent.current ) sendPoint();
	}, [ isDragging ] );

	const getValueWithinDragArea = ( { clientX, clientY, shiftKey } ) => {
		const { top, left } = dragAreaRef.current.getBoundingClientRect();
		let nextX = ( clientX - left ) / bounds.width;
		let nextY = ( clientY - top ) / bounds.height;
		// Enables holding shift to jump values by 10%.
		if ( shiftKey ) {
			nextX = Math.round( nextX / 0.1 ) * 0.1;
			nextY = Math.round( nextY / 0.1 ) * 0.1;
		}
		return getFinalValue( { x: nextX, y: nextY } );
	};

	const getFinalValue = ( value ) => {
		const resolvedValue = resolvePoint?.( value ) ?? value;
		resolvedValue.x = Math.max( 0, Math.min( resolvedValue.x, 1 ) );
		resolvedValue.y = Math.max( 0, Math.min( resolvedValue.y, 1 ) );
		return {
			x: parseFloat( resolvedValue.x ).toFixed( 2 ),
			y: parseFloat( resolvedValue.y ).toFixed( 2 ),
		};
	};

	const arrowKeyStep = ( event ) => {
		const { keyCode, shiftKey } = event;
		if ( ! [ UP, DOWN, LEFT, RIGHT ].includes( keyCode ) ) return;
		event.preventDefault();
		const value = { x, y };
		const step = shiftKey ? 0.1 : 0.01;
		const delta = keyCode === UP || keyCode === LEFT ? -1 * step : step;
		const axis = keyCode === UP || keyCode === DOWN ? 'y' : 'x';
		value[ axis ] = parseFloat( value[ axis ] ) + delta;
		sendPoint( getFinalValue( value ) );
	};

	const focalPointPosition = {
		left: x * bounds.width,
		top: y * bounds.height,
	};

	const classes = classnames(
		'components-focal-point-picker-control',
		className
	);

	const instanceId = useInstanceId( FocalPointPicker );
	const id = `inspector-focal-point-picker-control-${ instanceId }`;

	return (
		<BaseControl
			label={ label }
			id={ id }
			help={ help }
			className={ classes }
		>
			<MediaWrapper className="components-focal-point-picker-wrapper">
				<MediaContainer
					className="components-focal-point-picker"
					onKeyDown={ arrowKeyStep }
					onMouseDown={ startDrag }
					onBlur={ endDrag }
					ref={ dragAreaRef }
					role="button"
					tabIndex="-1"
				>
					<Grid bounds={ bounds } value={ `${ x }${ y }` } />
					<Media
						alt={ __( 'Media preview' ) }
						autoPlay={ autoPlay }
						onLoad={ updateBounds }
						src={ url }
					/>
					<FocalPoint
						{ ...focalPointPosition }
						isDragging={ isDragging }
					/>
				</MediaContainer>
			</MediaWrapper>
			<Controls
				point={ { x, y } }
				onChange={ ( value ) => {
					sendPoint( getFinalValue( value ) );
				} }
			/>
		</BaseControl>
	);
}
