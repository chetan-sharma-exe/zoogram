import { Box, Flex, Link, Text, VStack } from "@chakra-ui/react";
import SuggestedHeader from "./SuggestedHeader";
import SuggestedUser from "./SuggestedUser";
import useGetSuggestedUsers from "../../hooks/useGetSuggestedUsers";

const SuggestedUsers = () => {
  const { isLoading, suggestedUsers } = useGetSuggestedUsers();

  if (isLoading) return null;
  return (
    <VStack mt={10} py={8} px={12} gap={4} bg={"black"} borderRadius={30}>
      <SuggestedHeader />

      {suggestedUsers.length !== 0 && (
        <Flex alignItems={"center"} justifyContent={"space-between"} w={"full"}>
          <Text fontSize={12} fontWeight={"bold"} color={"gray.500"}>
            Suggested for you
          </Text>
          <Text
            fontSize={12}
            fontWeight={"bold"}
            _hover={{ color: "gray.400" }}
            cursor={"pointer"}
          >
            See all
          </Text>
        </Flex>
      )}

      {suggestedUsers.map((user) => (
        <SuggestedUser user={user} key={user.uid} />
      ))}

      <Box fontSize={12} color={"gray.500"} mt={5} alignSelf={"start"}>
        © 2025 Built By{" "}
        <Link target="_blank" color={"blue.500"} fontSize={14}>
          Chetan Sharma
        </Link>
      </Box>
    </VStack>
  );
};

export default SuggestedUsers;
