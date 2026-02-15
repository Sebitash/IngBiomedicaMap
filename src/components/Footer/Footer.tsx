import { Flex, useColorModeValue } from "@chakra-ui/react";
import React from "react";
import { UserContext } from "../../MapContext";
import StatusBar from "./StatusBar";

// Footer que solo se muestra si estas logueado
// (no tiene sentido ver promedio, creditos, etc si no los vas a guardar)
const Footer = () => {
  const { user } = React.useContext(UserContext);

  return (
    <Flex
      alignItems="center"
      bg={useColorModeValue("headerbg", "headerbgdark")}
      key={user.carrera.id}
      position="sticky"
      bottom={0}
      zIndex={2}
    >
      <StatusBar />
    </Flex>
  );
};

export default Footer;
