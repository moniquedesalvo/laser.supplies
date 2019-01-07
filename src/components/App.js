import React, { Component } from 'react';
import Card from './Card';
import CategoryPicker from './CategoryPicker';
import materials from '../manualScrape';

class App extends Component {
  render() {
    return (
		  <div>
        <CategoryPicker></CategoryPicker>
	      {materials.map(material => 
          <Card
            image={material.image}
            name={material.name}
            materialType={material.materialType}
            supplier={material.supplier}
            price={material.price}
          >
          </Card>
        )}
	    </div>
    );
  }
}



export default App;
