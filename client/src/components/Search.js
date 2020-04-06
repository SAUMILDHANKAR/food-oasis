import React, { useState } from "react";
import Downshift from "downshift";
import { MenuItem, TextField, Paper } from "@material-ui/core";
import LocationOnIcon from "@material-ui/icons/LocationOn";
import { makeStyles } from "@material-ui/core/styles";
import { useMapboxGeocoder } from "../hooks/useMapboxGeocoder";

const useStyles = makeStyles(() => ({
  paper: {
    maxHeight: "150px",
    overflowY: "auto",
    marginTop: 0,
    borderRadius: 4
  },
  container: {
    width: "100%"
  },
  address: {
    backgroundColor: "#fff",
    borderRadius: "4px 0 0 4px",
    height: 41,
    "& .MuiInputLabel-outlined": {
      transform: "translate(14px, 14px) scale(1)"
    },
    "& .MuiOutlinedInput-input": {
      padding: "11.5px 14px"
    },
    "& .MuiOutlinedInput-root": {
      borderRadius: "4px 0 0 4px"
    }
  }
}));

export default function Search({ userCoordinates, setOrigin }) {
  const classes = useStyles();
  const [selectedPlace, setSelectedPlace] = useState("");

  const {
    // _error,
    // _isLoading,
    mapboxResults,
    fetchMapboxResults
  } = useMapboxGeocoder();

  const handleInputChange = event => {
    setSelectedPlace(event.target.value);
    if (!event.target.value) {
      return;
    }
    fetchMapboxResults(event.target.value);
  };

  const handleDownshiftOnChange = selectedResult => {
    console.log(`Downshift.onChange ${JSON.stringify(selectedResult)}`);
    setSelectedPlace(selectedResult);
  };

  const renderInput = inputProps => {
    const { InputProps, classes } = inputProps;

    return (
      <TextField
        className={classes.address}
        variant="outlined"
        margin="none"
        fullWidth
        placeholder="Enter an address, neighborhood, ZIP"
        name="address"
        size="small"
        autoFocus
        InputProps={{
          classes: {
            input: classes.input
          },
          ...InputProps
        }}
      />
    );
  };

  const renderSuggestion = params => {
    const { item, index, itemProps, highlightedIndex, selectedItem } = params;
    if (!item) return;
    const isHighlighted = highlightedIndex === index;
    const isSelected = selectedItem && selectedItem.indexOf(item.name) > -1;

    return (
      !isSelected && (
        <MenuItem
          {...itemProps}
          key={item.id}
          selected={isHighlighted}
          component="div"
        >
          {item.place_name}
        </MenuItem>
      )
    );
  };

  const renderResults = params => {
    const {
      highlightedIndex,
      selectedItem,
      inputValue,
      mapboxResults,
      getItemProps
    } = params;

    if (!inputValue && userCoordinates && userCoordinates.latitude) {
      return (
        <MenuItem
          component="div"
          onClick={() => {
            console.log(`Current Location Suggestion.onClick`);
            setOrigin({ ...userCoordinates, locationName: "Current Location" });
            handleDownshiftOnChange("Current Location");
          }}
        >
          <LocationOnIcon /> Current Location
        </MenuItem>
      );
    }

    return (
      mapboxResults.length > 0 &&
      mapboxResults.slice(0, 10).map((item, index) => {
        const [long, lat] = item.center;
        const itemCoordinates = {
          latitude: lat,
          longitude: long
        };
        return renderSuggestion({
          item,
          index,
          itemProps: getItemProps({
            item: item.place_name,
            onClick: () => {
              setOrigin({
                ...itemCoordinates,
                locationName: item.place_name
              });
            }
          }),
          highlightedIndex,
          selectedItem,
          inputValue
        });
      })
    );
  };

  return (
    <>
      <Downshift
        onChange={handleDownshiftOnChange}
        itemToString={item => {
          return item ? item.place_name : "";
        }}
      >
        {({
          getInputProps,
          getItemProps,
          inputValue,
          selectedItem,
          highlightedIndex,
          toggleMenu,
          isOpen
        }) => (
          <div className={classes.container}>
            {renderInput({
              classes,
              selectedItem,
              availableItems: mapboxResults,
              InputProps: {
                ...getInputProps({
                  onClick: () => toggleMenu(),
                  onChange: handleInputChange,
                  value: inputValue || selectedPlace
                })
              }
            })}

            {isOpen && (
              <Paper className={classes.paper} square>
                {renderResults({
                  highlightedIndex,
                  selectedItem,
                  inputValue,
                  mapboxResults,
                  getItemProps
                })}
              </Paper>
            )}
            {/* <div>
              <div>
                <div>SelectedPlace</div>
                <pre>{JSON.stringify(selectedPlace, null, 2)}</pre>
              </div>
            </div>*/}
          </div>
        )}
      </Downshift>
    </>
  );
}
