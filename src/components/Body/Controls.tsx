import { SunIcon } from "@chakra-ui/icons";
import { Box, Link, Tooltip, useColorMode, useColorModeValue } from "@chakra-ui/react";
import React from "react";

// Componente con links externos, setupeo de color mode y un toast para reportar bugs
const Controls = () => {
  const { toggleColorMode } = useColorMode();

  return (
    <Box
      textAlign="right"
      bottom={0}
      right={0}
      mb={2}
      mr={2}
      position="absolute"
      color={useColorModeValue("text", "textdark")}
    >
      <Tooltip placement="top" label="Cambiar tema">
        <Link onClick={toggleColorMode}>
          <SunIcon boxSize={{ base: 4, md: 5 }} />
        </Link>
      </Tooltip>
    </Box>
  );
};

export default Controls;
