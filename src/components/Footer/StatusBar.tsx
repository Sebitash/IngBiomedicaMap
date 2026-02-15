import {
  Badge,
  Box,
  Flex,
  LightMode,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { GraphContext, UserContext } from "../../MapContext";
import { promediar } from "../../utils";

const StatusBar = () => {
  const { getters, toggleCheckbox, creditos } = React.useContext(GraphContext);
  const { user } = React.useContext(UserContext);

  const checkboxList = user.carrera.creditos.checkbox ?? [];
  const checkboxMaterias = checkboxList.filter((c) => c.cuentaMateria);
  const checkboxMateriasTotal = checkboxMaterias.length;
  const checkboxMateriasAprobadas = checkboxMaterias.filter(
    (c) => c.check,
  ).length;

  const obligatoriasTotal = React.useMemo(
    () => getters.CategoriaOnly("Materias Obligatorias").length,
    [getters],
  );

  const obligatoriasAprobadas = React.useMemo(
    () => getters.ObligatoriasAprobadas().length,
    [getters],
  );

  const materiasAprobadas = React.useMemo(
    () => obligatoriasAprobadas + checkboxMateriasAprobadas,
    [checkboxMateriasAprobadas, obligatoriasAprobadas],
  );

  const materiasTotal = React.useMemo(
    () => obligatoriasTotal + checkboxMateriasTotal + 11, //momentaneo, hasta que se agreguen las electivas como checkbox
    [checkboxMateriasTotal, obligatoriasTotal],
  );

  const materiasPercent = React.useMemo(() => {
    if (!materiasTotal) return 0;
    return Math.round((materiasAprobadas / materiasTotal) * 100);
  }, [materiasAprobadas, materiasTotal]);

  const obligatoriasPercent = React.useMemo(() => {
    if (!obligatoriasTotal) return 0;
    return Math.round((obligatoriasAprobadas / obligatoriasTotal) * 100);
  }, [obligatoriasAprobadas, obligatoriasTotal]);

  const electivasCredito = React.useMemo(
    () => creditos.find((c) => c.nombre === "Electivas"),
    [creditos],
  );

  const electivasTotalCreditos = React.useMemo(() => {
    const necesarios = electivasCredito?.creditosNecesarios ?? 0;
    return necesarios > 0 ? necesarios : 100;
  }, [electivasCredito]);

  const electivasPercent = React.useMemo(() => {
    return Math.min(
      100,
      Math.round(
        ((electivasCredito?.creditos || 0) / electivasTotalCreditos) * 100,
      ),
    );
  }, [electivasCredito, electivasTotalCreditos]);

  const promedio = React.useMemo(
    () => promediar(getters.MateriasAprobadasSinCBC()),
    [getters],
  );

  const checkboxes = user.carrera.creditos.checkbox ?? [];

  return (
    <Flex
      alignItems="center"
      gap={4}
      px={4}
      py={2}
      flexWrap="wrap"
      w="100%"
    >
      <Flex alignItems="center" gap={4} flex="1" minW="32ch">
        <Box minW="16ch">
          <Stat color="white" size="sm">
            <StatLabel>Total carrera</StatLabel>
            <StatNumber>
              {materiasAprobadas} de {materiasTotal} {" "}
              <Badge colorScheme="green" variant="solid">
                {materiasPercent}%
              </Badge>
            </StatNumber>
          </Stat>
        </Box>

        <Box flex="1" minW="24ch">
          <Stat color="white" size="sm">
            <StatLabel>Obligatorias</StatLabel>
            <StatNumber>
              {obligatoriasAprobadas} de {obligatoriasTotal} {" "}
              <Badge colorScheme="green" variant="solid">
                {obligatoriasPercent}%
              </Badge>
            </StatNumber>
          </Stat>
          <Progress
            mt={1}
            height={3}
            borderRadius={3}
            max={100}
            value={obligatoriasPercent}
            colorScheme="obligatorias"
            sx={{ "& > div:first-of-type": { transitionProperty: "width" } }}
          />
        </Box>
      </Flex>

      <Flex alignItems="center" gap={4} ml="auto" flexWrap="wrap">
        <Box flex="1" minW="24ch">
          <Stat color="white" size="sm">
            <StatLabel>Electivas</StatLabel>
            <StatNumber>
              {electivasCredito?.creditos || 0} de {" "}
              {electivasTotalCreditos} {" "}
              <Badge colorScheme="green" variant="solid">
                {electivasPercent}%
              </Badge>
            </StatNumber>
          </Stat>
          <Progress
            mt={1}
            height={3}
            borderRadius={3}
            max={100}
            value={electivasPercent}
            colorScheme="electivas"
            sx={{ "& > div:first-of-type": { transitionProperty: "width" } }}
          />
        </Box>

        <Flex alignItems="center" gap={4} flexWrap="wrap">
          {checkboxes.map((c) => (
            <LightMode key={c.nombre}>
              <Box
                cursor="pointer"
                minW="14ch"
                onClick={(e) => {
                  e.preventDefault();
                  toggleCheckbox(c.nombre);
                }}
              >
                <Text color="white" fontSize="sm" mb={1}>
                  {c.nombre}
                </Text>
                <Progress
                  height={2}
                  borderRadius={3}
                  max={100}
                  value={c.check ? 100 : 0}
                  colorScheme={c.color}
                  sx={{ "& > div:first-of-type": { transitionProperty: "width" } }}
                />
              </Box>
            </LightMode>
          ))}
        </Flex>

        <Box minW="12ch">
          <Stat color="white" size="sm" textAlign="right">
            <StatLabel>Promedio</StatLabel>
            <StatNumber>{promedio}</StatNumber>
          </Stat>
        </Box>
      </Flex>
    </Flex>
  );
};

export default StatusBar;
