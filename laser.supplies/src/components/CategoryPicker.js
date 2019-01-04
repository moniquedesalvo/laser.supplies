import React, { Component } from 'react';
import materials from '../manualScrape';


// CategoryPicker component should display all categories on the left of the screen 
// and maybe have a check box and highlighting or something to show that it's been selected 

class CategoryPicker extends Component {
render() {
    return (
      <div>
        <ul>
          <li>Acrylic</li>
          <li>Wood</li>
        </ul>
      </div>
    )
  }
}


export default CategoryPicker;