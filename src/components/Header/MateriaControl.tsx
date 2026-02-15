import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import {
  Button,
  Flex,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Tooltip,
} from "@chakra-ui/react";
import React from "react";
import { GraphContext } from "../../MapContext";

const ControlProps = {
  height: "fit-content",
  borderRadius: "md",
  border: "2px solid white",
  mx: 3,
};

const TooltipProps = {
  closeOnClick: true,
  hasArrow: true,
};

const ButtonProps = {
  _hover: {
    backgroundColor: "transparent",
  },
  borderRadius: "0",
  variant: "link",
  fontSize: "larger",
};

const NumberInputProps = {
  _hover: {
    borderColor: "transparent",
  },
  _focus: {
    borderColor: "transparent",
  },
  color: "white",
  fontWeight: "bold",
};

const NumberStepperProps = {
  border: "none",
  fontSize: "small",
};

// Botonera para cambiar la nota y estado de la materia seleccionada
const MateriaControl = () => {
  const { getNode, aprobar, displayedNode, desaprobar } =
    React.useContext(GraphContext);

  const node = React.useMemo(
    () => (displayedNode ? getNode(displayedNode) : undefined),
    [displayedNode, getNode],
  );

  return displayedNode && node && node.id !== "CBC" && node.id !== "CPU" ? (
    <Flex alignItems="center" height="fit-content">
      <Flex {...ControlProps} alignItems="center" p={1}>
        {node && node.nota > 0 ? (
          <>
            <Tooltip closeOnClick hasArrow label="Nota">
              <NumberInput
                borderColor="transparent"
                width="8ch"
                inputMode="numeric"
                onChange={(_, nota) => {
                  aprobar(displayedNode, nota);
                }}
                value={node?.nota}
                min={4}
                max={10}
                mx={1}
                onFocus={(ev) => {
                  ev.target.blur();
                }}
              >
                <NumberInputField {...NumberInputProps} />
                <NumberInputStepper height="100%" my={0}>
                  <NumberIncrementStepper
                    {...NumberStepperProps}
                    color="green.500"
                    _hover={{ color: "green.600" }}
                  />
                  <NumberDecrementStepper
                    {...NumberStepperProps}
                    color="red.500"
                    _hover={{ color: "red.600" }}
                  />
                </NumberInputStepper>
              </NumberInput>
            </Tooltip>
            <Tooltip closeOnClick hasArrow label="Aprobar por Equivalencia">
              <Button
                {...ButtonProps}
                fontSize="smaller"
                color="aprobadas.400"
                minWidth={0}
                ml={1}
                mr={2}
                onClick={() => aprobar(displayedNode, 0)}
              >
                <strong>E</strong>
              </Button>
            </Tooltip>
          </>
        ) : (
          <Tooltip {...TooltipProps} label="Aprobar">
            <Button
              {...ButtonProps}
              color="green.500"
              onClick={() => aprobar(displayedNode, 4)}
            >
              <CheckIcon />
            </Button>
          </Tooltip>
        )}

        <Tooltip {...TooltipProps} label="Desaprobar">
          <Button
            {...ButtonProps}
            borderX="2px solid white"
            color="red.500"
            onClick={() => desaprobar(displayedNode)}
          >
            <CloseIcon boxSize={4} />
          </Button>
        </Tooltip>

        <Tooltip {...TooltipProps} label="Regularizar">
          <Button
            {...ButtonProps}
            color="yellow.300"
            onClick={() => aprobar(displayedNode, -1)}
          >
            <strong>R</strong>
          </Button>
        </Tooltip>
      </Flex>
    </Flex>
  ) : (
    <></>
  );
};

export default MateriaControl;
