import React, {Component} from 'react';


export default class ErrorWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {hasError: false};
  }

  componentDidCatch(error, info) {
    this.setState({hasError: true});
    // You can also log the error to an error reporting service
    // TODO maybe automatically get the faulty file ? (no need for an issue)
  }

  render() {
    if (this.state.hasError) {
      return <div id="error">
        <div>
          <h2>Zut alors, we encountered an error.</h2> <br/>
          If you were trying to load a file, please report it by making an
          <a href="https://github.com/Mapioi/OnlineLoggerPro/issues">issue here</a>
          and including the problematic file.
        </div>
      </div>;
    }

    return this.props.children;
  }
}
