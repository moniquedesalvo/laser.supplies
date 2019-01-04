import React, { Component } from 'react';
import materials from '../manualScrape';


class Card extends Component {
render() {
		return (
			<div id="card">
				<img src={this.props.image}/>
				<div id="card-text">
					<h3>{this.props.name + " " + this.props.materialType}</h3>
					<h4>{this.props.supplier}</h4>
					<p>${this.props.price} / sqft</p>
				</div>
			</div>
		);
	}
}

export default Card;